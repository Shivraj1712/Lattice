SERVER_DIR=server
CLIENT_DIR=client 

.PHONY : client dev tidy server server-build client-build

client:
	cd $(CLIENT_DIR) && bun create-next-app@latest
dev:
	cd $(CLIENT_DIR) && bun run dev
tidy:
	cd $(SERVER_DIR) && go mod tidy
server:
	cd $(SERVER_DIR) && air
swag: 
	cd $(SERVER_DIR) && swag init -d . -g cmd/api/main.go --parseDependency --parseInternal -o docs
server-build:
	cd $(SERVER_DIR) && go build -o ./cmd/api/main.go
client-build:
	cd $(CLIENT_DIR) && bun build
