# Campus Lost and Found - Troubleshooting Guide

## Issue: Item Details Not Loading

If the item details page shows "Untitled item", "Unknown location", and "No contact info", the backend API is not returning data properly.

### Quick Diagnostic Steps

1. **Open the API Test Page**
   - Navigate to: `http://localhost:5500/client/api-test.html`
   - This will automatically run tests on your backend connection
   - Check the console results to see what's failing

2. **Verify Backend is Running**
   - Backend should be running on `http://localhost:5000`
   - Check your backend terminal for any errors
   - Ensure MongoDB is connected

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages from the item-details.js script
   - You'll see logs like:
     - `Loading item from: http://localhost:5000/api/items/...`
     - `Response status: 200`
     - `Item data received: {...}`

### Common Issues and Solutions

#### Issue: "Cannot connect to backend"
**Solution:** 
- Make sure the Node.js backend is running (`npm start`)
- Verify it's on `localhost:5000`
- Check that MongoDB is running

#### Issue: "API Error: 404 Not Found"
**Solution:**
- The item ID in the URL doesn't exist
- Verify the item was created in the database
- Check MongoDB to see all items

#### Issue: "Received empty item data from server"
**Solution:**
- The API is returning null or empty object
- Check backend API response format
- Ensure item document has all required fields:
  - `title`
  - `description`
  - `location`
  - `category`
  - `contact` (or `phone`)
  - `image` (or `photo`)
  - `createdAt`

#### Issue: "CORS Error"
**Solution:**
- Backend needs to allow requests from `localhost:5500`
- Add CORS headers in backend: `res.header("Access-Control-Allow-Origin", "*");`

### Backend Response Format

The item endpoint should return data like this:

```json
{
  "_id": "69fe38240e6790383c75b0ed",
  "title": "Blue Backpack",
  "description": "A blue backpack found at the library",
  "category": "accessories",
  "location": "Library",
  "contact": "9999955555",
  "image": "/uploads/istockphoto-685577032-612x612-1778267436739.jpg",
  "createdAt": "2026-05-08T19:10:36.755Z"
}
```

### Testing the API Directly

Use these curl commands to test the backend:

```bash
# Test health check
curl http://localhost:5000/health

# Get all items
curl http://localhost:5000/api/items

# Get single item (replace ID with actual ID)
curl http://localhost:5000/api/items/69fe38240e6790383c75b0ed
```

### Debug Mode

The frontend now includes detailed console logging. Open DevTools and:
1. Check the Network tab to see the API requests
2. Click on the request to see response headers and body
3. Check the Console tab for detailed logs

### If Still Not Working

1. Check backend logs for errors
2. Verify database has items with correct structure
3. Test API endpoints directly with Postman or curl
4. Check for CORS issues in browser console
5. Ensure `API_URL` in `js/config.js` is correct

---

**API URL:** `http://localhost:5000/api`  
**Frontend Port:** `5500` (Live Server)  
**Backend Port:** `5000` (Node.js)
