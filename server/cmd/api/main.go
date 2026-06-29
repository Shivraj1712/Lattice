package main

import (
	"net/http"

	_ "github.com/Shivraj1712/Lattice.git/docs"
	"github.com/Shivraj1712/Lattice.git/internal/config"
	"github.com/Shivraj1712/Lattice.git/internal/database"
	"github.com/gin-gonic/gin"
	swaggoFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @Summary		First Route
// @Description Testing the first route
// @Router 		/health [get]
// @Success 	200 {object} map[string]string
// @Failure 	500 {object} map[string]stringe
// @Tags		Health
func HealthCheck(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"message": "server is running on port : 8080",
	})
}

// @title 			Lattice API
// @version			1.0
// @description 	API for the responding to the Client Side section of the Client Server Architecture
// @host			localhost:8080
// @BasePath		/
func main() {
	config.FetchConfig()
	database.ConnectDB()
	database.MigrateModels()
	r := gin.Default()
	r.GET("/health", HealthCheck)
	r.GET("swagger/*any", ginSwagger.WrapHandler(swaggoFiles.Handler))
	r.Run(":8080")
}
