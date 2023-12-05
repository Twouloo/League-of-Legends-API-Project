import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

function Graph(props) {
  console.log("graph called");
  const currentRecentPlayerGraphTime = props.graphTimes;

  const graphOptions = {
    interaction: {
      intersect: false,
      mode: 'index',
      axis: 'x'
    },
    scales: {
      y: {
        ticks: {
          stepSize: 1,
          callback: function (value, index, values) {
            return Math.floor(value) === value ? value : '';
          }
        },
        suggestedMin: 0,
        suggestedMax: 2,

      },
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.9)"
        }
      }
    },
    plugins: {
      title: {
        display: false,
        text: "Total games played",
        color: "rgb(255, 255, 255)"
      }
    }
  };


  return <Line
    datasetIdKey='id'
    data={{
      datasets: [
        {
          id: 1,
          label: '',
          data: currentRecentPlayerGraphTime,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgb(255, 255, 255)',
          fill: true,
          pointRadius: 0,
          cubicInterpolationMode: 'monotone'
        }
      ],
    }}
    options={graphOptions}
  />;
}

export default Graph;