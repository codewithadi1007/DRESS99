
99Dresses - The Infinite Closet 👗
A high-end, full-stack fashion marketplace where users can trade designer dresses using a virtual currency called Buttons. This project demonstrates a complete integration between a modern UI, a Node.js/Express backend, and a MongoDB database.

🚀 Features Implemented
Dynamic Marketplace: Fetches real-time dress listings from MongoDB Atlas using a RESTful API.

Portrait-Optimized UI: A custom CSS architecture that ensures fashion images maintain a professional 3:4 aspect ratio without stretching.

Intelligent Routing: A dynamic "Handshake" system that passes MongoDB ObjectIDs from the homepage to a detailed product view via URL parameters.

Interactive Product Details: A dedicated page (product.html) that fetches specific item data and renders a "Purchase with Buttons" interactive experience.

Automated Data Seeding: A custom seed.js script to reset, validate, and update the store's inventory in bulk.

Responsive Design: Fully fluid layout that adapts from large desktop monitors to mobile screens.

🏗️ Technical Architecture
Frontend: Built with semantic HTML5 and advanced CSS3 (Grid/Flexbox). JavaScript handles the asynchronous fetch requests to populate the UI without page reloads.

Backend: An Express.js server acts as the middleware, handling API routes for both the full collection and individual item lookups.

Database: MongoDB Atlas stores the dress objects, including titles, brands, prices in Buttons, and external image URLs.

Data Flow:

index.html requests all items from /api/items.

User clicks a card, sending an _id to product.html.

product.html requests a single document from /api/items/:id to render the details. 🛠️ Setup and Installation
Prepare the Environment:

Navigate to the backend folder using your terminal.

Install necessary dependencies by running npm install.

Create a .env file in the backend directory and add your MongoDB connection string: MONGO_URI=your_mongodb_atlas_connection_string.

Synchronize the Database:

Run node seed.js in the terminal.

This command deletes old entries and inserts the latest dress collection (including the Reformation and Boho Wrap pieces) into MongoDB Atlas.

Verify you see the message: ✅ Data Seeded with Categories!.

🚀 Running the Project
Start the Backend Server:

In the backend terminal, run node server.js.

Ensure the console displays: 🚀 Server running on http://localhost:3000 and ✅ Connected to MongoDB Atlas.

Launch the Frontend:

Open index.html in VS Code.

Click the "Go Live" button at the bottom of the editor to launch the homepage in your browser.

Crucial Note: Always start from index.html to ensure the application correctly initializes the "handshake" with the database.

👗 Testing the Core Features
Browse and Filter:

Scroll to the "Trending Now" section on the homepage to see all dresses fetched from the database.

Use the filter buttons (e.g., Casual, Designer) to test the dynamic loading logic.

View Dress Details:

Click on any dress card in the gallery.

The browser will navigate to product.html?id=[UniqueID], passing the specific MongoDB ID in the URL.

Verify that the full-length portrait image and dress details load correctly.

Purchase with Buttons:

On the product.html page, click the "Purchase with Buttons" button.

An alert should appear confirming the purchase and the deduction of virtual "Buttons" from your closet.

Upload a New Dress:

Click "Upload Your Dress" on the homepage.

Fill out the modal form with a new brand, title, and image URL.

Submit the form and refresh the homepage to see your new item in the gallery. 
