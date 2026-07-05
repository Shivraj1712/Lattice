SERVER_DIR=server
CLIENT_DIR=client 

.PHONY : dev tidy server server-build client-build swag

dev:
	cd $(CLIENT_DIR) && bun run dev
tidy:
	cd $(SERVER_DIR) && go mod tidy
server:
	cd $(SERVER_DIR) && air
swag: 
	cd $(SERVER_DIR) && swag init -d . -g cmd/api/main.go --parseDependency --parseInternal -o docs
server-build:
	cd $(SERVER_DIR) && go build -o ./bin/server ./cmd/api/main.go
client-build:
	cd $(CLIENT_DIR) && bun run build
