# Cache

## Setup KeyDB as a Redis cache
KeyDB is a high-performance fork of Redis with a focus on multithreading and memory efficiency
It is designed to be a drop-in replacement for Redis
KeyDB is fully compatible with Redis and supports all Redis commands

```
docker run \
-d --name keydb \
-p 6379:6379 \
-e "CACHE_PASSWORD=your-password" \
-v /path/to/your/data:/data \
-v /path/to/your/logs:/logs keydb/keydb \
eqalpha/keydb
```

Process to connect with KeyDB is same as Redis.
1. Run the docker container.
2. Set the password by logging into container
   a. First run redis-cli as 
      ```# redis-cli```
   b. Set the password using
      ```# auth <your-password>```
3. Create a client and connect to KeyDB.
4. Use the client to perform operations.
5. Close the connection when done.
