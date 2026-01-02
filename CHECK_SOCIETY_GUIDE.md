# How to Check Your Created Society

## Problem
You created a society but didn't see the response. Now when you try to create again, you get a 409 error saying you already have a society.

## Solution: Check Your Existing Society

### Method 1: Get All Societies (Recommended)

**Endpoint:** `GET /societies`

**Request:**
```bash
GET http://localhost:4001/societies
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Response:**
You'll get an array with your society:
```json
[
  {
    "id": "society-uuid",
    "name": "Your Society Name",
    "code": "RH-1234",
    "addressLine1": "...",
    "city": "...",
    "state": "...",
    "pincode": "...",
    "societyType": "APARTMENT",
    "createdBy": "your-user-id",
    "status": "ACTIVE",
    "createdAt": "2024-12-25T...",
    "updatedAt": "2024-12-25T...",
    "creator": {
      "id": "your-user-id",
      "name": "Your Name",
      "email": "your@email.com"
    },
    "_count": {
      "units": 0,
      "residents": 0
    }
  }
]
```

### Method 2: Get Your User Profile

**Endpoint:** `GET /auth/me`

**Request:**
```bash
GET http://localhost:4001/auth/me
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Response:**
Your user object will have `societyId` field:
```json
{
  "id": "user-uuid",
  "name": "Your Name",
  "email": "your@email.com",
  "role": "SOCIETY_ADMIN",
  "status": "ACTIVE",
  "societyId": "society-uuid",  // ← This will have your society ID
  "unitId": null,
  ...
}
```

Then use the `societyId` to get society details:

**Endpoint:** `GET /societies/:societyId`

**Request:**
```bash
GET http://localhost:4001/societies/{societyId}
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

## Why You Might Not Have Seen the Response

1. **Network timeout** - Request completed but response didn't reach you
2. **Frontend error handling** - Error was caught but not displayed
3. **Response was successful** - But UI didn't update/show the response
4. **Browser console** - Check browser network tab for the actual response

## Next Steps

1. **Call `GET /societies`** to see your created society
2. **Note the `societyId`** from the response
3. **Verify your user profile** has the `societyId` updated
4. **Now you can create units** using `POST /units` (societyId comes from token automatically)

## Testing with cURL

```bash
# Get your societies
curl -X GET http://localhost:4001/societies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get your profile (to see societyId)
curl -X GET http://localhost:4001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get specific society (if you have the ID)
curl -X GET http://localhost:4001/societies/SOCIETY_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Important Notes

- The 409 error confirms your society was created successfully
- You can only have ONE society per admin (MVP constraint)
- Once you have a society, you can start creating units
- The `societyId` in your user profile should be automatically updated


