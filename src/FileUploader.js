// Import necessary modules
import React, { useState } from 'react'; // React and useState for state management
import Papa from 'papaparse'; // Papa Parse library to parse CSV files

// Functional component for file uploading and processing
const FileUploader = ({ onDataProcessed }) => {
  // State to store the selected file
  const [file, setFile] = useState(null);

  // Event handler for file selection
  const handleFileChange = (event) => {
    // Update the state with the selected file
    setFile(event.target.files[0]);
  };

  // Function to process the selected file
  const processFile = () => {
    // Ensure a file is selected before proceeding
    if (!file) return;

    // Parse the CSV file using Papa Parse
    Papa.parse(file, {
      header: true, // Treat the first row as the header
      dynamicTyping: true, // Automatically convert values to appropriate data types
      complete: (results) => {
        // Filter the parsed data to include only rows with specific fields
        const data = results.data.filter(row =>
          row.sales_date && row.product_description && row.quantity_sold
        );

        // Pass the processed data to the parent component via the callback
        onDataProcessed(data);
      },
    });
  };

  // Render the file input and process button
  return (
    <div>
      {/* Input field to upload CSV files */}
      <input type="file" accept=".csv" onChange={handleFileChange} />
      
      {/* Button to trigger the file processing */}
      <button onClick={processFile}>Process File</button>
    </div>
  );
};

// Export the component for use in other parts of the application
export default FileUploader;
