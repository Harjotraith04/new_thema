import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab, useTheme, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sankey,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import WordCloud from 'react-wordcloud';
import { Network } from '@nivo/network';
import { TreeMap } from '@nivo/treemap';
import { Sankey as NivoSankey } from '@nivo/sankey';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import InfoIcon from '@mui/icons-material/Info';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#8884d8', '#ffc658'];

// Enhanced dummy data for demonstration
const dummyData = {
  codeFrequency: [
    { name: 'Theme A', value: 45, category: 'Primary' },
    { name: 'Theme B', value: 32, category: 'Primary' },
    { name: 'Theme C', value: 28, category: 'Secondary' },
    { name: 'Theme D', value: 24, category: 'Secondary' },
    { name: 'Theme E', value: 18, category: 'Tertiary' }
  ],
  timeSeriesData: [
    { name: 'Jan', ThemeA: 10, ThemeB: 8, ThemeC: 6, ThemeD: 4, ThemeE: 2 },
    { name: 'Feb', ThemeA: 15, ThemeB: 12, ThemeC: 9, ThemeD: 6, ThemeE: 3 },
    { name: 'Mar', ThemeA: 20, ThemeB: 15, ThemeC: 12, ThemeD: 8, ThemeE: 4 },
    { name: 'Apr', ThemeA: 25, ThemeB: 18, ThemeC: 15, ThemeD: 10, ThemeE: 5 },
    { name: 'May', ThemeA: 30, ThemeB: 22, ThemeC: 18, ThemeD: 12, ThemeE: 6 }
  ],
  sentimentData: [
    { name: 'Positive', value: 35, color: '#00C49F' },
    { name: 'Neutral', value: 45, color: '#FFBB28' },
    { name: 'Negative', value: 20, color: '#FF8042' }
  ],
  coOccurrenceData: [
    { source: 'Theme A', target: 'Theme B', value: 15 },
    { source: 'Theme A', target: 'Theme C', value: 10 },
    { source: 'Theme B', target: 'Theme D', value: 8 },
    { source: 'Theme C', target: 'Theme E', value: 12 },
    { source: 'Theme D', target: 'Theme E', value: 5 }
  ],
  categoryDistribution: [
    { name: 'Primary', value: 77, color: '#0088FE' },
    { name: 'Secondary', value: 52, color: '#00C49F' },
    { name: 'Tertiary', value: 18, color: '#FFBB28' }
  ],
  themeGrowth: [
    { name: 'Theme A', growth: 200, current: 45 },
    { name: 'Theme B', growth: 175, current: 32 },
    { name: 'Theme C', growth: 150, current: 28 },
    { name: 'Theme D', growth: 120, current: 24 },
    { name: 'Theme E', growth: 100, current: 18 }
  ]
};

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && children}
    </div>
  );
}

function ChartHeader({ title, description }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{title}</Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">{description}</Typography>
        )}
      </Box>
      <MuiTooltip title={description || ''}>
        <IconButton size="small">
          <InfoIcon fontSize="small" />
        </IconButton>
      </MuiTooltip>
    </Box>
  );
}

function VisualizationDashboard({ data }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedChart, setExpandedChart] = useState(null);

  // Process data for visualizations
  // Use dummyData.codeFrequency directly for rendering on Analytics Dashboard tab
  // This ensures charts always render with data, even if props.data is empty
  const chartData = dummyData.codeFrequency; 

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleExpand = (chartId) => {
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };

  const renderChart = (chartId, title, description, children) => (
    <Paper 
      sx={{ 
        p: 2, 
        height: expandedChart === chartId ? '600px' : '300px',
        transition: 'height 0.3s ease-in-out',
        position: 'relative',
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <ChartHeader title={title} description={description} />
        <IconButton onClick={() => toggleExpand(chartId)} size="small">
          {expandedChart === chartId ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Box>
      <ResponsiveContainer width="99%" height="80%">
        {children}
      </ResponsiveContainer>
    </Paper>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Tab label="Analytics Dashboard" />
        <Tab label="Theme Analysis" />
        <Tab label="Trend Analysis" />
      </Tabs>

      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            {/* Overview Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Overview</Typography>
            </Grid>
            
            {/* Top Row - Main Metrics */}
            <Grid item xs={12} md={6}>
              {renderChart(
                'frequency',
                'Code Frequency Distribution',
                'Shows the distribution of codes across your dataset',
                <BarChart data={dummyData.codeFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderChart(
                'distribution',
                'Code Distribution',
                'Visual representation of code proportions',
                <PieChart>
                  <Pie
                    data={dummyData.codeFrequency}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {dummyData.codeFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </Grid>

            {/* Middle Row - Trends and Categories */}
            <Grid item xs={12} md={8}>
              {renderChart(
                'timeline',
                'Theme Development Over Time',
                'Tracks the evolution of themes across time periods',
                <AreaChart data={dummyData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="ThemeA" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} />
                  <Area type="monotone" dataKey="ThemeB" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} />
                  <Area type="monotone" dataKey="ThemeC" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} />
                </AreaChart>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderChart(
                'categories',
                'Category Distribution',
                'Shows the distribution of themes by category',
                <PieChart>
                  <Pie
                    data={dummyData.categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {dummyData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </Grid>

            {/* Bottom Row - Network and Hierarchy */}
            <Grid item xs={12} md={6}>
              {renderChart(
                'network',
                'Theme Network',
                'Visualizes relationships between different themes',
                <Network
                  data={{
                    nodes: dummyData.codeFrequency.map(item => ({
                      id: item.name,
                      value: item.value
                    })),
                    links: dummyData.coOccurrenceData.map(item => ({
                      source: item.source,
                      target: item.target,
                      value: item.value
                    }))
                  }}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  linkDistance={50}
                  centeringStrength={0.3}
                  repulsivity={6}
                  nodeSize={n => n.value * 2}
                  activeNodeSize={n => n.value * 2.5}
                  nodeColor={n => COLORS[n.index % COLORS.length]}
                  linkThickness={n => 2 + n.value * 2}
                  linkColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  motionConfig="gentle"
                />
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderChart(
                'hierarchy',
                'Theme Hierarchy',
                'Shows the hierarchical structure of themes',
                <TreeMap
                  data={{
                    name: 'Themes',
                    children: dummyData.codeFrequency.map(item => ({
                      name: item.name,
                      value: item.value
                    }))
                  }}
                  identity="name"
                  value="value"
                  valueFormat=" >-.0f"
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  labelSkipSize={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
                  parentLabelPosition="left"
                  parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
                  colors={{ scheme: 'category10' }}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            {/* Theme Analysis Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Theme Analysis</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {renderChart(
                'sentiment',
                'Theme Sentiment Analysis',
                'Distribution of sentiment across themes',
                <PieChart>
                  <Pie
                    data={dummyData.sentimentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {dummyData.sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {renderChart(
                'growth',
                'Theme Growth Analysis',
                'Shows the growth and current state of themes',
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="category" dataKey="name" name="Theme" />
                  <YAxis type="number" dataKey="growth" name="Growth" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter
                    name="Growth"
                    data={dummyData.themeGrowth}
                    fill={theme.palette.primary.main}
                  />
                </ScatterChart>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {/* Trend Analysis Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Trend Analysis</Typography>
            </Grid>
            
            <Grid item xs={12}>
              {renderChart(
                'trends',
                'Theme Trends Over Time',
                'Detailed view of theme development trends',
                <LineChart data={dummyData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ThemeA" stroke={COLORS[0]} />
                  <Line type="monotone" dataKey="ThemeB" stroke={COLORS[1]} />
                  <Line type="monotone" dataKey="ThemeC" stroke={COLORS[2]} />
                  <Line type="monotone" dataKey="ThemeD" stroke={COLORS[3]} />
                  <Line type="monotone" dataKey="ThemeE" stroke={COLORS[4]} />
                </LineChart>
              )}
            </Grid>
            <Grid item xs={12}>
              {renderChart(
                'radar',
                'Theme Importance Radar',
                'Compares the relative importance of different themes',
                <RadarChart outerRadius={90} data={dummyData.themeGrowth.map(item => ({ subject: item.name, A: item.current, fullMark: Math.max(...dummyData.themeGrowth.map(d => d.current)) }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Themes" dataKey="A" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
}

export default VisualizationDashboard; 