// Script to extract all data from JSON files and convert to CSV
// Run this in the browser console when viewing the site

(async function extractDataToCSV() {
  // Define the categories to extract
  const categories = ['design', 'typography', 'tools', 'ai', '3d'];
  
  // Initialize array to hold all data
  const allItems = [];
  
  // Process each category
  for (const category of categories) {
    try {
      // Fetch the JSON file
      const response = await fetch(`data/${category}.json`);
      if (!response.ok) {
        console.error(`Failed to fetch ${category}.json: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // Process each subcategory
      for (const subcategory of data.subcategories) {
        // Process each item in the subcategory
        for (const item of subcategory.items) {
          // Convert tags array to comma-separated string
          const tagsString = item.tags.join(',');
          
          // Add to our items array
          allItems.push({
            category: data.id,
            subcategory: subcategory.id,
            title: item.title,
            description: item.description,
            url: item.url,
            tags: tagsString
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${category}.json:`, error);
    }
  }
  
  // Convert to CSV
  const headers = ['category', 'subcategory', 'title', 'description', 'url', 'tags'];
  const csvContent = [
    // Add headers
    headers.join(','),
    // Add data rows
    ...allItems.map(item => {
      return [
        item.category,
        item.subcategory,
        // Escape quotes and wrap text fields in quotes to handle commas and special characters
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        item.url,
        `"${item.tags}"`
      ].join(',');
    })
  ].join('\n');
  
  // Output to console
  console.log(csvContent);
  
  // Create a download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'database-content.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('CSV file created and download initiated!');
  console.log(`Total items exported: ${allItems.length}`);
})(); 