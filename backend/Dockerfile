FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git 

WORKDIR /app


COPY go.mod go.sum ./

RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/main.go

FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server .

RUN mkdir -p storage/pfps storage/resumes storage/logos

EXPOSE 8080

CMD ["./server"]