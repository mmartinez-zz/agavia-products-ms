# agavia-tool-create-product

Remote tool microservice: `create_product_from_chat`

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
```

## Run

```bash
npm run dev
```

## Endpoint

```
POST /execute
```

### Request

```json
{
  "tool": "create_product_from_chat",
  "businessId": "clxxx...",
  "args": {
    "title": "Producto ejemplo",
    "description": "Descripción opcional",
    "price": 99.99,
    "imageUrl": "https://example.com/image.jpg"
  }
}
```

### Response (success)

```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "Producto ejemplo"
  }
}
```

### Response (error)

```json
{
  "success": false,
  "error": "VALIDATION_ERROR"
}
```
