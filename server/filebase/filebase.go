package filebase

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gin-gonic/gin"
)

type FilebaseConfig struct {
	AccessKey string
	SecretKey string
	Bucket    string
	Endpoint  string
}

type FilebaseClient struct {
	config   FilebaseConfig
	s3Client *s3.S3
}

type UploadRequest struct {
	Content  string `json:"content"`
	Filename string `json:"filename"`
}

type UploadResponse struct {
	Success bool   `json:"success"`
	CID     string `json:"cid"`
	URL     string `json:"url"`
	Message string `json:"message,omitempty"`
}

// Initialize Filebase client
func NewFilebaseClient() (*FilebaseClient, error) {
	config := FilebaseConfig{
		AccessKey: os.Getenv("FILEBASE_ACCESS_KEY"),
		SecretKey: os.Getenv("FILEBASE_SECRET_KEY"),
		Bucket:    os.Getenv("FILEBASE_BUCKET"),
		Endpoint:  "https://s3.filebase.com",
	}

	// Use default values if environment variables are not set
	if config.AccessKey == "" {
		config.AccessKey = "YOUR_ACCESS_KEY" // Replace with actual credentials
	}
	if config.SecretKey == "" {
		config.SecretKey = "YOUR_SECRET_KEY" // Replace with actual credentials
	}
	if config.Bucket == "" {
		config.Bucket = "collabify-docs" // Replace with your bucket name
	}

	// Create AWS session for Filebase
	sess, err := session.NewSession(&aws.Config{
		Credentials: credentials.NewStaticCredentials(config.AccessKey, config.SecretKey, ""),
		Endpoint:    aws.String(config.Endpoint),
		Region:      aws.String("us-east-1"), // Filebase uses us-east-1
		S3ForcePathStyle: aws.Bool(true),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	client := &FilebaseClient{
		config:   config,
		s3Client: s3.New(sess),
	}

	return client, nil
}

// UploadHandler handles file uploads to Filebase via IPFS
func UploadHandler(c *gin.Context) {
	client, err := NewFilebaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: "Failed to initialize Filebase client",
		})
		return
	}

	client.uploadToFilebase(c)
}

// GetHandler handles file retrieval from Filebase via IPFS
func GetHandler(c *gin.Context) {
	client, err := NewFilebaseClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Filebase client",
		})
		return
	}

	client.getFromFilebase(c)
}

func (f *FilebaseClient) uploadToFilebase(c *gin.Context) {
	var req UploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	// Upload to Filebase S3
	contentReader := bytes.NewReader([]byte(req.Content))
	_, err := f.s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(f.config.Bucket),
		Key:         aws.String(req.Filename),
		Body:        contentReader,
		ContentType: aws.String("application/json"),
		Metadata: map[string]*string{
			"uploaded-via": aws.String("collabify-server"),
		},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: fmt.Sprintf("Upload failed: %v", err),
		})
		return
	}

	// Return success response
	url := fmt.Sprintf("https://s3.filebase.com/%s/%s", f.config.Bucket, req.Filename)
	c.JSON(http.StatusOK, UploadResponse{
		Success: true,
		CID:     req.Filename, // Using filename as CID for now
		URL:     url,
	})
}

func (f *FilebaseClient) getFromFilebase(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing file key",
		})
		return
	}

	// Get object from Filebase
	result, err := f.s3Client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(f.config.Bucket),
		Key:    aws.String(key),
	})

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": fmt.Sprintf("File not found: %v", err),
		})
		return
	}

	defer result.Body.Close()

	// Read the content
	content, err := io.ReadAll(result.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to read file: %v", err),
		})
		return
	}

	// Return the content
	c.JSON(http.StatusOK, gin.H{
		"content": string(content),
		"key":     key,
	})
}