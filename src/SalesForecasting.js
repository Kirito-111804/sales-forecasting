import React, { useState } from 'react'; // React and useState for state management
import * as tf from '@tensorflow/tfjs'; // TensorFlow.js for machine learning
import { Line } from 'react-chartjs-2'; // Chart.js component for rendering line charts
import {
  Chart as ChartJS, // Base Chart.js object
  CategoryScale, // Category scale for x-axis
  LinearScale, // Linear scale for y-axis
  LineElement, // Line element for line charts
  PointElement, // Points on the line chart
  Title, // Chart title
  Tooltip, // Tooltips for interaction
  Legend // Legend for datasets
} from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Define the SalesForecasting component
const SalesForecasting = ({ data }) => {
  const [chartData, setChartData] = useState(null); // State to hold chart data
  const [searchTerm, setSearchTerm] = useState(''); // State to hold the search input
  const [filteredPredictions, setFilteredPredictions] = useState([]); // State to store filtered predictions

  // Function to preprocess input data for the model
  const preprocessData = () => {
    if (!data || data.length === 0) { // Handle empty or undefined data
      console.error('Data is empty or undefined');
      return { inputs: [], outputs: [], productMapping: {} }; // Return empty placeholders
    }

    console.log('Raw input data:', data);

    // Extract numeric representations of sales dates (months) and map product descriptions to indices
    const salesDates = data.map((row) => {
      const date = new Date(row.sales_date);
      return !isNaN(date) ? date.getMonth() + 1 : null; // Extract the month, ignoring invalid dates
    });

    const products = [...new Set(data.map((row) => row.product_description))]; // Unique product descriptions
    const productMapping = Object.fromEntries(products.map((p, i) => [p, i])); // Map products to numeric indices

    const quantities = data.map((row) => parseFloat(row.quantity_sold) || 0); // Parse quantities as numbers

    // Prepare input and output arrays
    const inputs = data.map((row, i) => {
      if (salesDates[i] !== null && productMapping[row.product_description] !== undefined) {
        return [salesDates[i], productMapping[row.product_description]]; // Use month and product index as inputs
      }
      return null; // Skip invalid rows
    }).filter((input) => input !== null); // Remove null values

    const outputs = quantities.filter((q, i) => inputs[i] !== null); // Outputs corresponding to valid inputs

    console.log('Processed inputs:', inputs);
    console.log('Processed outputs:', outputs);
    console.log('Product mapping:', productMapping);

    return { inputs, outputs, productMapping }; // Return preprocessed data
  };

  // Function to build the TensorFlow.js model
  const buildModel = () => {
    const model = tf.sequential(); // Create a sequential model
    model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [2] })); // First dense layer
    model.add(tf.layers.dense({ units: 1 })); // Output layer
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' }); // Compile the model with optimizer and loss function
    return model;
  };

  // Function to train the model and generate predictions
  const trainAndPredict = async () => {
    const { inputs, outputs, productMapping } = preprocessData(); // Preprocess the data

    if (inputs.length === 0 || outputs.length === 0) { // Ensure valid inputs and outputs
      console.error('Invalid input or output data');
      return;
    }

    // Convert input and output data to tensors
    const xs = tf.tensor2d(inputs, [inputs.length, inputs[0].length]);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    const model = buildModel(); // Build the model
    console.log('Training the model...');
    await model.fit(xs, ys, { epochs: 50 }); // Train the model with 50 epochs
    console.log('Model training complete.');

    // Generate predictions for the next 6 months
    const predictions = [];
    for (let i = 1; i <= 6; i++) { // Loop through the next 6 months
      Object.keys(productMapping).forEach((product) => { // Loop through each product
        const predictionTensor = model.predict(
          tf.tensor2d([[i, productMapping[product]]]) // Predict sales for each product in the given month
        );
        const predictedValue = predictionTensor.dataSync()[0]; // Extract the prediction value
        predictionTensor.dispose(); // Dispose of tensor to free memory

        predictions.push({
          product, // Product name
          sales_date: i, // Month number
          predicted: predictedValue, // Predicted sales value
        });
      });
    }

    console.log('Predictions:', predictions);
    visualizeResults(predictions); // Visualize the predictions
  };

  // Function to filter predictions based on the search term (product name)
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Update search term on input change
  };

  // Function to filter predictions based on search
  const filterPredictions = (predictions) => {
    if (!searchTerm) return predictions; // If no search term, return all predictions

    return predictions.filter((prediction) =>
      prediction.product.toLowerCase().includes(searchTerm.toLowerCase()) // Filter based on product name
    );
  };

  // Function to visualize predictions using Chart.js
  const visualizeResults = (predictions) => {
    const filtered = filterPredictions(predictions); // Filter predictions based on search term

    const products = [...new Set(filtered.map((p) => p.product))]; // Get unique products from filtered predictions

    // Get actual sales data for the last 6 months (for comparison)
    const actualSales = products.map((product) => {
      return Array.from({ length: 6 }, (_, month) => {
        // Find the actual sales for each month
        const salesData = data.filter((row) => {
          const date = new Date(row.sales_date);
          return row.product_description === product && date.getMonth() + 1 === month + 1;
        });
        return salesData.length > 0 ? salesData[0].quantity_sold : 0; // Default to 0 if no sales data
      });
    });

    const datasets = products.map((product, idx) => ({
      label: `${product} (Predicted)`,
      data: filtered
        .filter((p) => p.product === product)
        .map((p) => p.predicted),
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      fill: false,
      tension: 0.4,
    }));

    // Add the actual sales data line for each product
    products.forEach((product, idx) => {
      datasets.push({
        label: `${product} (Actual)`,
        data: actualSales[idx], // Actual sales data
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
        borderDash: [5, 5], // Dashed line for actual sales
        fill: false,
        tension: 0.4,
      });
    });

    // Update chart data state
    setChartData({
      labels: Array.from({ length: 6 }, (_, i) => `Month ${i + 1}`), // Labels for the x-axis
      datasets, // Data for the chart
    });
  };

  return (
    <div>
      {/* Search input for filtering products */}
      <input
        type="text"
        placeholder="Search for a product"
        value={searchTerm}
        onChange={handleSearchChange} // Handle search input change
        style={{ margin: '20px 0', padding: '10px', fontSize: '16px' }}
      />
      
      {/* Button to trigger training and prediction */}
      <button onClick={trainAndPredict}>Train & Predict</button>

      {/* Render the chart if data is available */}
      {chartData && (
        <div style={{ width: '1500px', height: '1000px', margin: 'auto' }}>
          <Line
            data={chartData} // Chart data
            options={{
              maintainAspectRatio: false, // Disable aspect ratio
              responsive: true, // Make chart responsive
              plugins: {
                legend: {
                  position: 'top', // Legend position
                },
                title: {
                  display: true, // Display title
                  text: 'Sales Forecast', // Title text
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

// Export the component for use in other parts of the application
export default SalesForecasting;
