// CSV to Supabase Uploader
// This script helps upload your database-content.csv to Supabase

// ----- CONFIGURATION -----
// Load credentials from localStorage or use the provided URL
const SUPABASE_URL = localStorage.getItem('supabaseUrl') || 'https://knsngybgnzpvptwmjllg.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('supabaseKey') || '';

// Store the URL in localStorage if not already set
if (!localStorage.getItem('supabaseUrl')) {
  localStorage.setItem('supabaseUrl', SUPABASE_URL);
}

// ----- CSV PARSER -----
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  // Process headers to remove quotes if present
  for (let i = 0; i < headers.length; i++) {
    headers[i] = headers[i].replace(/^"(.*)"$/, '$1');
  }
  
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const currentLine = lines[i];
    const values = [];
    let insideQuotes = false;
    let currentValue = '';
    
    // Parse the line, handling quoted values that might contain commas
    for (let j = 0; j < currentLine.length; j++) {
      const char = currentLine[j];
      
      if (char === '"' && (j === 0 || currentLine[j-1] !== '\\')) {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim().replace(/^"(.*)"$/, '$1'));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue.trim().replace(/^"(.*)"$/, '$1'));
    
    // Create object from headers and values
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    
    // Process tags into an array
    if (row.tags) {
      row.tags = row.tags.split(',').map(tag => tag.trim());
    }
    
    results.push(row);
  }
  
  return results;
}

// ----- SUPABASE INTEGRATION -----
async function uploadToSupabase(data) {
  // Load Supabase client (you need to include the Supabase JS library in your HTML)
  const { createClient } = supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log(`Starting upload of ${data.length} resources to Supabase...`);
  
  // First, create a unique list of categories and subcategories
  const categories = [...new Set(data.map(item => item.category))];
  const subcategories = {};
  
  data.forEach(item => {
    if (!subcategories[item.category]) {
      subcategories[item.category] = new Set();
    }
    subcategories[item.category].add(item.subcategory);
  });
  
  // Upload categories first
  for (const category of categories) {
    console.log(`Processing category: ${category}`);
    
    // Check if the category already exists
    const { data: existingCategory, error: categoryCheckError } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('id', category)
      .single();
      
    if (categoryCheckError && categoryCheckError.code !== 'PGRST116') {
      console.error(`Error checking category ${category}:`, categoryCheckError);
      continue;
    }
    
    // If the category doesn't exist, insert it
    if (!existingCategory) {
      // Find an example of this category to get the title, icon, and description
      const categoryExample = data.find(item => item.category === category);
      
      const { error: categoryInsertError } = await supabaseClient
        .from('categories')
        .insert([{
          id: category,
          title: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
          icon: `icon-${category}.svg`,
          description: `Resources related to ${category}`
        }]);
        
      if (categoryInsertError) {
        console.error(`Error inserting category ${category}:`, categoryInsertError);
        continue;
      }
      
      console.log(`Created category: ${category}`);
    } else {
      console.log(`Category ${category} already exists.`);
    }
    
    // Process subcategories for this category
    for (const subcategory of subcategories[category]) {
      console.log(`Processing subcategory: ${subcategory} in ${category}`);
      
      // Check if the subcategory already exists
      const { data: existingSubcategory, error: subcategoryCheckError } = await supabaseClient
        .from('subcategories')
        .select('id')
        .eq('id', subcategory)
        .eq('category_id', category)
        .single();
        
      if (subcategoryCheckError && subcategoryCheckError.code !== 'PGRST116') {
        console.error(`Error checking subcategory ${subcategory}:`, subcategoryCheckError);
        continue;
      }
      
      // If the subcategory doesn't exist, insert it
      if (!existingSubcategory) {
        // Find an example for this subcategory
        const subcategoryExample = data.find(item => 
          item.category === category && item.subcategory === subcategory);
        
        const { error: subcategoryInsertError } = await supabaseClient
          .from('subcategories')
          .insert([{
            id: subcategory,
            category_id: category,
            title: subcategoryExample.subcategory
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }]);
          
        if (subcategoryInsertError) {
          console.error(`Error inserting subcategory ${subcategory}:`, subcategoryInsertError);
          continue;
        }
        
        console.log(`Created subcategory: ${subcategory} in ${category}`);
      } else {
        console.log(`Subcategory ${subcategory} already exists in ${category}.`);
      }
    }
  }
  
  // Now upload all the resources
  for (const resource of data) {
    console.log(`Processing resource: ${resource.title}`);
    
    // Check if the resource already exists (by URL)
    const { data: existingResource, error: resourceCheckError } = await supabaseClient
      .from('resources')
      .select('id')
      .eq('url', resource.url)
      .single();
      
    if (resourceCheckError && resourceCheckError.code !== 'PGRST116') {
      console.error(`Error checking resource ${resource.title}:`, resourceCheckError);
      continue;
    }
    
    // If the resource doesn't exist, insert it
    if (!existingResource) {
      const { error: resourceInsertError } = await supabaseClient
        .from('resources')
        .insert([{
          title: resource.title,
          description: resource.description,
          url: resource.url,
          tags: resource.tags,
          category_id: resource.category,
          subcategory_id: resource.subcategory
        }]);
        
      if (resourceInsertError) {
        console.error(`Error inserting resource ${resource.title}:`, resourceInsertError);
        continue;
      }
      
      console.log(`Created resource: ${resource.title}`);
    } else {
      // Update the resource if it exists
      const { error: resourceUpdateError } = await supabaseClient
        .from('resources')
        .update({
          title: resource.title,
          description: resource.description,
          tags: resource.tags,
          category_id: resource.category,
          subcategory_id: resource.subcategory
        })
        .eq('id', existingResource.id);
        
      if (resourceUpdateError) {
        console.error(`Error updating resource ${resource.title}:`, resourceUpdateError);
        continue;
      }
      
      console.log(`Updated resource: ${resource.title}`);
    }
  }
  
  console.log('Upload completed successfully!');
}

// ----- MAIN FUNCTION -----
async function main() {
  try {
    // Check if Supabase client is available
    if (typeof supabase === 'undefined') {
      console.error('Supabase client not found. Make sure to include the Supabase JS library.');
      return;
    }
    
    // Read the CSV file
    console.log('Reading CSV file...');
    const response = await fetch('database-content.csv');
    const csvText = await response.text();
    
    // Parse the CSV
    console.log('Parsing CSV data...');
    const data = parseCSV(csvText);
    console.log(`Found ${data.length} resources in CSV.`);
    
    // Upload to Supabase
    await uploadToSupabase(data);
    
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
  }
}

// ----- SETUP INSTRUCTIONS -----
function showInstructions() {
  console.log(`
=== SUPABASE SETUP INSTRUCTIONS ===

1. Create a Supabase account at https://supabase.com/
2. Create a new project
3. In your project SQL editor, create the following tables:

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

4. Go to Project Settings -> API and copy your:
   - Project URL (set as SUPABASE_URL)
   - anon/public key (set as SUPABASE_ANON_KEY)

5. Update this script with your credentials
6. Add the Supabase JavaScript client to your HTML:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

7. Run this script in your browser console (or add a button to run it)
  `);
}

// Show setup instructions first
showInstructions();

// Uncomment this line to run the script automatically
// main();

// Instead, expose a button or function to manually trigger upload
window.uploadCSVToSupabase = main; 