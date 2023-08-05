import "./App.css";
import Select from "react-select";
import React, { useState, useEffect } from "react";
import Card from "./SummaryCard";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

function App() {
  const locationList = [
    { value: "AB", label: "Alberta" },
    { value: "BC", label: "British Columbia" },
    { value: "canada", label: "Canada" },
    { value: "MB", label: "Manitoba" },
    { value: "NB", label: "New Brunswick" },
    { value: "NL", label: "Newfoundland and Labrador" },
    { value: "NT", label: "Northwest Territories" },
    { value: "NS", label: "Nova Scotia" },
    { value: "NU", label: "Nunavut" },
    { value: "ON", label: "Ontario" },
    { value: "PE", label: "Prince Edward Island" },
    { value: "QC", label: "Quebec" },
    { value: "SK", label: "Saskatchewan" },
    { value: "YT", label: "Yukon" },
  ];
  const baseUrl = "https://api.opencovid.ca";
  const timeseriesOptions = {
    responsive: true,
    normalized: true,
    plugins: {
      tooltip: {
        enabled: false,
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
      },
    },
  };

  const [activeLocation, setActiveLocation] = useState("canada");
  const [lastUpdated, setlastUpdated] = useState("");
  const [summaryData, setSummaryData] = useState({});
  const [timeseriesData, setTimeseriesData] = useState({
    datasets: [],
  });

  useEffect(() => {
    getVersion();
    getSummaryData();
    getTimeseriesData();
  }, [activeLocation]);

  const getVersion = async () => {
    try {
      const res = await fetch(`${baseUrl}/version`);
      const data = await res.json();
      setlastUpdated(data.version);
    } catch (error) {
      console.error("Error fetching version:", error);
    }
  };

  const getSummaryData = async () => {
    try {
      const url =
        activeLocation.toLowerCase() === "canada"
          ? `${baseUrl}/summary?geo=can`
          : `${baseUrl}/summary?loc=${activeLocation}`;
  
      const res = await fetch(url);
      const resData = await res.json();
  
      console.log(resData);
      if (resData.data && resData.data.length > 0) {
        const summaryData = resData.data[0];
        const formattedData = {};
  
        Object.keys(summaryData).forEach((key) => {
          formattedData[key] = summaryData[key].toLocaleString();
        });
        setSummaryData(formattedData);
      } else {
        setSummaryData({});
      }
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };
  
  const getTimeseriesData = async () => {
    try {
      const url =
        activeLocation.toLowerCase() === "canada"
          ? `${baseUrl}/timeseries?geo=can`
          : `${baseUrl}/timeseries?loc=${activeLocation}&ymd=true`;
  
      const res = await fetch(url);
      const data = await res.json();
  
      if (data.data) {
        const mappedDatasets = timeseriesDataMap(data.data);
        setTimeseriesData({ datasets: mappedDatasets });
        console.log("Timeseries Data:", mappedDatasets); // Log the mapped datasets to the console
      } else {
        setTimeseriesData({ datasets: [] });
      }
    } catch (error) {
      console.error("Error fetching timeseries data:", error);
    }
  };
  
  function timeseriesDataMap(fetchedData) {
    const tsKeyMap = [
      {
        datasetLabel: "cases",
        dataKey: "value",
        dateKey: "date",
        borderColor: "red",
      },
      {
        datasetLabel: "deaths",
        dataKey: "value",
        dateKey: "date",
        borderColor: "grey",
      },
      {
        datasetLabel: "tests_completed",
        dataKey: "value",
        dateKey: "date",
        borderColor: "blue",
      },
      {
        datasetLabel: "vaccine_administration_total_doses",
        dataKey: "value",
        dateKey: "date",
        borderColor: "green",
      },
    ];
  
    const datasets = tsKeyMap.map((dataSeries) => {
      return {
        label: dataSeries.datasetLabel,
        borderColor: dataSeries.borderColor,
        data: fetchedData[dataSeries.datasetLabel].map((dataPoint) => ({
          y: dataPoint[dataSeries.dataKey],
          x: dataPoint[dataSeries.dateKey],
        })),
      };
    });
  
    return datasets;
  }
  

  return (
    <div className="App">
      <h1>COVID 19 Dashboard </h1>

      <div className="dashboard-container">
        <div className="dashboard-menu ">
          <Select
            options={locationList}
            onChange={(selectedOption) =>
              setActiveLocation(selectedOption.value)
            }
            defaultValue={locationList.find(
              (options) => options.value === activeLocation
            )}
            className="dashboard-select"
          />
          <p className="update-date">
            Last Updated: {lastUpdated}
          </p>
        </div>
        <div className="dashboard-timeseries">
          <Line
            data={timeseriesData}
            options={timeseriesOptions}
            className="line-chart"
          />
        </div>
        <div className="dashboard-summary">
          <Card title="Total Cases" value={summaryData.cases} />
          <Card
            title="Total Recovered"
            value={summaryData.tests_completed}
          />
          <Card title="Total Deaths" value={summaryData.deaths} />
          <Card
            title="Total Vaccinated"
            value={summaryData.vaccine_administration_total_doses}
          />
        </div>
      </div>
    </div>
  );
}

export default App;