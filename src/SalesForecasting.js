import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const SalesForecasting = ({ data }) => {
  const [chartData, setChartData] = useState(null);

  // Preprocess the data
  const preprocessData = () => {
    if (!data || data.length === 0) {
      console.error('Data is empty or undefined');
      return { inputs: [], outputs: [], productMapping: {} };
    }

    const salesDates = data.map((row) => new Date(row.sales_date).getMonth() + 1);
    const products = [...new Set(data.map((row) => row.product_description))];
    const productMapping = Object.fromEntries(products.map((p, i) => [p, i]));
    const quantities = data.map((row) => row.quantity_sold);

    const inputs = data.map((row, i) => [
      salesDates[i],
      productMapping[row.product_description],
    ]);
    const outputs = quantities.map((q) => [q]);

    return { inputs, outputs, productMapping };
  };

  // Build the TensorFlow.js model
  const buildModel = () => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [2] }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  };

  // Train the model and make predictions
  const trainAndPredict = async () => {
    const { inputs, outputs, productMapping } = preprocessData();

    if (inputs.length === 0 || outputs.length === 0) {
      console.error('Invalid input or output data');
      return;
    }

    const xs = tf.tensor2d(inputs, [inputs.length, inputs[0].length]);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    const model = buildModel();
    await model.fit(xs, ys, { epochs: 50 });

    const predictions = [];
    for (let i = 1; i <= 6; i++) {
      Object.keys(productMapping).forEach((product) => {
        const predictionTensor = model.predict(
          tf.tensor2d([[i, productMapping[product]]])
        );
        const predictedValue = predictionTensor.dataSync()[0];
        predictionTensor.dispose();

        predictions.push({
          product,
          sales_date: i,
          predicted: predictedValue,
        });
      });
    }

    visualizeResults(predictions);
  };

  // Visualize predictions with Chart.js
  const visualizeResults = (predictions) => {
    const products = [...new Set(predictions.map((p) => p.product))];
    const datasets = products.map((product) => ({
      label: product,
      data: predictions
        .filter((p) => p.product === product)
        .map((p) => p.predicted),
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      fill: false,
    }));

    setChartData({
      labels: Array.from({ length: 6 }, (_, i) => `Month ${i + 1}`),
      datasets,
    });
  };

  return (
    <div>
      <button onClick={trainAndPredict}>Train & Predict</button>
      {chartData && <Line data={chartData} />}
    </div>
  );
};

export default SalesForecasting;
