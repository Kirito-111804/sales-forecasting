// Import necessary libraries and components
import React, { useState } from 'react'; // React and useState for state management
import FileUploader from './FileUploader'; // Component for uploading and processing CSV files
import SalesForecasting from './SalesForecasting'; // Component for training and visualizing sales predictions

// Main App component
const App = () => {
  // State to hold the uploaded and processed data
  const [data, setData] = useState(null);

  return (
    <div>
      {/* Main title of the application */}
      <h1 style={{ textAlign: 'center' }}>Sales Forecasting</h1>
      
      {/* Conditional rendering based on whether data is available */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {!data && (
          // Render the FileUploader component if no data has been uploaded yet
          <FileUploader onDataProcessed={setData} />
        )}
        {data && (
          // Render the SalesForecasting component when data is available
          <SalesForecasting data={data} />
        )}
      </div>
    </div>
  );
};

// Export the App component for rendering
export default App;
