# Mindy®

Mindy® is a clean, modern digital library for design resources, tools, and references.

## Overview

Mindy® provides a centralized hub for designers, developers, and creatives to discover and access useful resources across various categories:

- Design UI/UX
- Typography
- AI Tools
- 3D Modeling
- Development Tools

## Features

- **Clean, Minimal Interface**: Distraction-free browsing experience
- **Category Organization**: Resources neatly organized by category and subcategory
- **Search Functionality**: Find resources quickly with the search feature
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Resource Saving**: Save your favorite resources for later access

## Technical Details

### Structure

- `index.html` - Main application HTML
- `styles/` - CSS stylesheets
  - `main.css` - Primary styles
  - `animations.css` - Animation effects
- `scripts/` - JavaScript files
  - `main.js` - Application logic
- `data/` - JSON data files for resources
- `assets/` - Icons and images

### Design System

The application uses a consistent design system with:

- Modern color palette with primary blue accent
- Clean typography using Space Grotesk font
- Consistent spacing and component styling
- Subtle animations for improved user experience

### Browser Support

Mindy® is designed to work on modern browsers including:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser or use a local server
3. Browse categories or search for resources

## Development

To modify or extend Mindy®:

1. Edit the HTML/CSS/JS files as needed
2. Add new resources by updating the JSON files in the `data/` directory
3. Test changes across different screen sizes

## License

All rights reserved. Mindy® is a proprietary application.

---

Designed and developed with ❤️

# Mindy Hub - Supabase Integration Guide

This guide explains how to use the Supabase integration feature to store and manage your content in a Supabase database.

## Overview

Mindy Hub now supports storing all resource content in a Supabase database. This provides several benefits:

- **Database management**: Use Supabase's interface to manage your data
- **API access**: Access your resources programmatically through Supabase's API
- **Authentication**: Add user authentication and custom permissions
- **Scalability**: Build on the database as your needs grow

## Setup Instructions

### 1. Create a Supabase account

- Go to [Supabase](https://supabase.com/) and create an account
- Create a new project with a name of your choice

### 2. Create database tables

After creating your project, open the SQL Editor in Supabase and run the following SQL to create the necessary tables:

```sql
-- Create categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT
);

-- Create subcategories table
CREATE TABLE subcategories (
  id TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  PRIMARY KEY (id, category_id)
);

-- Create resources table
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  tags TEXT[] DEFAULT '{}',
  category_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (category_id, subcategory_id) REFERENCES subcategories(category_id, id)
);
```

### 3. Get your Supabase credentials

- Go to Project Settings → API
- Copy your Project URL and anon/public key

### 4. Configure Mindy Hub

- Access the admin panel by pressing `Ctrl+Shift+A` when viewing the site
- Enter your Supabase Project URL and anon key
- Click "Save Configuration"

### 5. Upload your data

- Use the "Upload CSV to Supabase" button to upload all the data from the CSV file to your Supabase database

## Using the Supabase Integration

### Uploading CSV to Supabase

1. Press `Ctrl+Shift+A` to open the admin panel
2. Click "Upload CSV to Supabase"
3. Wait for the confirmation message

### Exporting from Supabase to CSV

1. Press `Ctrl+Shift+A` to open the admin panel
2. Click "Sync from Supabase"
3. The browser will download a CSV file with all your content

## Modifying Data

You can modify your data in several ways:

1. **Via CSV**: Edit the CSV file and upload it again using the admin panel
2. **Via Supabase**: Use Supabase's table editor to add, modify, or delete records
3. **Via API**: Use Supabase's REST or GraphQL API to programmatically update data

## Switching Between Local and Supabase Data

The site will continue to use the local JSON files by default. To switch to Supabase data, you'll need to modify the data loading functions to fetch from Supabase instead.

A future update will add a toggle in the admin panel to switch between data sources.

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check your Supabase URL and anon key in the admin panel
2. Ensure your tables are created with the exact structure shown above
3. Check your browser console for specific error messages

For further assistance, please contact support.
