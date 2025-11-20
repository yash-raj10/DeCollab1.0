package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type User struct {
	ID            interface{} `json:"id" bson:"_id,omitempty"`
	Email         string      `json:"email" bson:"email"`
	Name          string      `json:"name" bson:"name"`
	WalletAddress string      `json:"walletAddress" bson:"walletAddress"`
}

type WalletCheckRequest struct {
	WalletAddress string `json:"walletAddress" binding:"required"`
}

type WalletRegisterRequest struct {
	WalletAddress string `json:"walletAddress" binding:"required"`
	Name          string `json:"name" binding:"required"`
	Email         string `json:"email" binding:"required"`
}


type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

var (
	usersCollection *mongo.Collection
	DB_URL          string
	JWT_KEY         string
	jwtSecret       []byte
)

func init() {
	_ = godotenv.Load()
	DB_URL = os.Getenv("DATABASE_URL")
	JWT_KEY = os.Getenv("JWT_KEY")
	jwtSecret = []byte(JWT_KEY)
}

// initializes MongoDB connection
func InitMongoDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := DB_URL
	
	client, err := mongo.Connect(options.Client().ApplyURI(mongoURI))
	if err != nil {
		return err
	}

	// connection test
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	usersCollection = client.Database("collabify").Collection("users1.0")
	
	fmt.Println("Connected to MongoDB!")
	return nil
}

// returns the users collection for use in other packages
func GetUsersCollection() *mongo.Collection {
	return usersCollection
}

// generates a JWT token for a user using wallet address
func GenerateJWT(walletAddress string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"wallet_address": walletAddress,
		"exp":            time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// get token from "Bearer <token>"
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

		// parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// get wallet address from token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		walletAddress, ok := claims["wallet_address"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid wallet address in token"})
			c.Abort()
			return
		}

		c.Set("wallet_address", walletAddress)
		c.Next()
	}
}

// returns the current user's profile
func GetProfile(c *gin.Context) {
	walletAddress, exists := c.Get("wallet_address")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var user User
	err := usersCollection.FindOne(context.Background(), bson.M{"walletAddress": walletAddress}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// checks if a wallet address exists in the database
func CheckWallet(c *gin.Context) {
	var req WalletCheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	err := usersCollection.FindOne(context.Background(), bson.M{"walletAddress": req.WalletAddress}).Decode(&user)
	if err != nil {
		// User not found
		c.JSON(http.StatusOK, gin.H{
			"exists": false,
			"message": "User not registered",
		})
		return
	}

	// User found
	c.JSON(http.StatusOK, gin.H{
		"exists": true,
		"user": user,
	})
}

// registers a new user with wallet address
func RegisterWallet(c *gin.Context) {
	var req WalletRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if wallet already exists
	var existingUser User
	err := usersCollection.FindOne(context.Background(), bson.M{"walletAddress": req.WalletAddress}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Wallet address already registered"})
		return
	}

	// Check if email already exists
	err = usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	user := User{
		Email:         req.Email,
		Name:          req.Name,
		WalletAddress: req.WalletAddress,
	}

	result, err := usersCollection.InsertOne(context.Background(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	user.ID = result.InsertedID

	// Generate JWT using wallet address
	token, err := GenerateJWT(user.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": user,
	})
}
