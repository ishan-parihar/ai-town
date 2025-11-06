/**
 * Advanced Pattern Recognition Engine
 * Implements sophisticated pattern detection, cross-domain correlation analysis,
 * temporal pattern analysis, and anomaly detection for the AI Council LifeOS system
 */

class PatternRecognitionEngine {
  constructor() {
    this.patterns = new Map();
    this.correlations = new Map();
    this.anomalies = new Map();
    this.temporalPatterns = new Map();
    this.predictionModels = new Map();
    this.userProfile = new Map();
    this.learningHistory = [];
  }

  /**
   * Extract features from personal data for ML analysis
   */
  extractFeatures(data) {
    const features = {
      timestamp: data.timestamp,
      dataType: data.dataType,
      source: data.source,
      numericalFeatures: [],
      categoricalFeatures: [],
      temporalFeatures: this.extractTemporalFeatures(data.timestamp),
      valueFeatures: this.extractValueFeatures(data.value),
    };

    // Extract numerical features from data value
    if (typeof data.value === 'object') {
      Object.entries(data.value).forEach(([key, value]) => {
        if (typeof value === 'number') {
          features.numericalFeatures.push({
            feature: key,
            value: value,
            normalized: this.normalizeValue(value, key),
          });
        } else {
          features.categoricalFeatures.push({
            feature: key,
            value: value,
          });
        }
      });
    }

    return features;
  }

  /**
   * Extract temporal features from timestamp
   */
  extractTemporalFeatures(timestamp) {
    const date = new Date(timestamp);
    return {
      hourOfDay: date.getHours(),
      dayOfWeek: date.getDay(),
      dayOfMonth: date.getDate(),
      month: date.getMonth(),
      season: Math.floor(date.getMonth() / 3),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      timeOfDay: this.getTimeOfDay(date.getHours()),
    };
  }

  /**
   * Get time of day category
   */
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Extract features from data value
   */
  extractValueFeatures(value) {
    const features = {};
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((key) => {
        const val = value[key];
        if (typeof val === 'number') {
          features[`${key}_abs`] = Math.abs(val);
          features[`${key}_log`] = val > 0 ? Math.log(val) : 0;
          features[`${key}_sqrt`] = Math.sqrt(Math.abs(val));
        }
      });
    }
    return features;
  }

  /**
   * Normalize value for ML processing
   */
  normalizeValue(value, feature) {
    const ranges = this.getFeatureRanges(feature);
    if (ranges.min === ranges.max) return 0.5;
    return (value - ranges.min) / (ranges.max - ranges.min);
  }

  /**
   * Get feature ranges for normalization
   */
  getFeatureRanges(feature) {
    const defaultRanges = {
      steps: { min: 0, max: 20000 },
      heartRate: { min: 40, max: 120 },
      sleep: { min: 0, max: 12 },
      amount: { min: 0, max: 1000 },
      timeSpent: { min: 0, max: 480 },
      weight: { min: 100, max: 300 },
      energy: { min: 1, max: 10 },
    };
    return defaultRanges[feature] || { min: 0, max: 100 };
  }

  /**
   * Detect patterns in sequential data
   */
  detectPatterns(dataPoints) {
    const patterns = {
      trends: this.detectTrends(dataPoints),
      cycles: this.detectCycles(dataPoints),
      correlations: this.detectCorrelations(dataPoints),
      anomalies: this.detectAnomalies(dataPoints),
      clusters: this.detectClusters(dataPoints),
    };

    return patterns;
  }

  /**
   * Detect trends in time series data
   */
  detectTrends(dataPoints) {
    const trends = [];
    const groupedData = this.groupByDataType(dataPoints);

    Object.entries(groupedData).forEach(([dataType, points]) => {
      const sortedPoints = points.sort((a, b) => a.timestamp - b.timestamp);

      // Linear regression for trend detection
      const trend = this.calculateLinearTrend(sortedPoints);
      if (trend.slope !== 0 && trend.confidence > 0.7) {
        trends.push({
          dataType,
          direction: trend.slope > 0 ? 'increasing' : 'decreasing',
          strength: Math.abs(trend.slope),
          confidence: trend.confidence,
          duration: sortedPoints[sortedPoints.length - 1].timestamp - sortedPoints[0].timestamp,
          description: this.generateTrendDescription(dataType, trend),
        });
      }
    });

    return trends;
  }

  /**
   * Calculate linear trend using least squares
   */
  calculateLinearTrend(dataPoints) {
    if (dataPoints.length < 3) return { slope: 0, confidence: 0 };

    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map((d) => this.extractNumericalValue(d));

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate confidence (R-squared)
    const meanY = sumY / n;
    const totalSumSquares = y.reduce((total, yi) => total + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = y.reduce((total, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return total + Math.pow(yi - predicted, 2);
    }, 0);

    const rSquared = 1 - residualSumSquares / totalSumSquares;
    const confidence = Math.max(0, Math.min(1, rSquared));

    return { slope, intercept, confidence };
  }

  /**
   * Extract numerical value from data point
   */
  extractNumericalValue(dataPoint) {
    if (typeof dataPoint.value === 'number') return dataPoint.value;
    if (typeof dataPoint.value === 'object') {
      const values = Object.values(dataPoint.value).filter((v) => typeof v === 'number');
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }
    return 0;
  }

  /**
   * Generate human-readable trend description
   */
  generateTrendDescription(dataType, trend) {
    const direction = trend.slope > 0 ? 'improving' : 'declining';
    const strength = Math.abs(trend.slope) > 0.5 ? 'strongly' : 'moderately';

    const descriptions = {
      health: `Your health metrics are ${strength} ${direction}`,
      finance: `Your financial patterns show a ${strength} ${direction} trend`,
      productivity: `Your productivity is ${strength} ${direction}`,
      relationships: `Your relationship activities are ${strength} ${direction}`,
      career: `Your career development is ${strength} ${direction}`,
    };

    return (
      descriptions[dataType] || `Your ${dataType} data shows a ${strength} ${direction} pattern`
    );
  }

  /**
   * Detect cyclical patterns
   */
  detectCycles(dataPoints) {
    const cycles = [];
    const groupedData = this.groupByDataType(dataPoints);

    Object.entries(groupedData).forEach(([dataType, points]) => {
      const dailyCycle = this.detectDailyCycle(points);
      const weeklyCycle = this.detectWeeklyCycle(points);
      const monthlyCycle = this.detectMonthlyCycle(points);

      if (dailyCycle.strength > 0.6) {
        cycles.push({ ...dailyCycle, type: 'daily', dataType });
      }
      if (weeklyCycle.strength > 0.6) {
        cycles.push({ ...weeklyCycle, type: 'weekly', dataType });
      }
      if (monthlyCycle.strength > 0.6) {
        cycles.push({ ...monthlyCycle, type: 'monthly', dataType });
      }
    });

    return cycles;
  }

  /**
   * Detect daily patterns
   */
  detectDailyCycle(dataPoints) {
    const hourlyData = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    dataPoints.forEach((point) => {
      const hour = new Date(point.timestamp).getHours();
      const value = this.extractNumericalValue(point);
      hourlyData[hour] += value;
      hourlyCounts[hour]++;
    });

    // Average values for each hour
    const hourlyAverages = hourlyData.map((sum, i) =>
      hourlyCounts[i] > 0 ? sum / hourlyCounts[i] : 0,
    );

    // Calculate pattern strength (variance from mean)
    const mean = hourlyAverages.reduce((a, b) => a + b, 0) / hourlyAverages.length;
    const variance =
      hourlyAverages.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      hourlyAverages.length;
    const strength = Math.min(1, variance / (mean * mean + 1));

    return {
      strength,
      pattern: hourlyAverages,
      peakHour: hourlyAverages.indexOf(Math.max(...hourlyAverages)),
      lowHour: hourlyAverages.indexOf(Math.min(...hourlyAverages)),
    };
  }

  /**
   * Detect weekly patterns
   */
  detectWeeklyCycle(dataPoints) {
    const dailyData = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    dataPoints.forEach((point) => {
      const day = new Date(point.timestamp).getDay();
      const value = this.extractNumericalValue(point);
      dailyData[day] += value;
      dailyCounts[day]++;
    });

    const dailyAverages = dailyData.map((sum, i) =>
      dailyCounts[i] > 0 ? sum / dailyCounts[i] : 0,
    );

    const mean = dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length;
    const variance =
      dailyAverages.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      dailyAverages.length;
    const strength = Math.min(1, variance / (mean * mean + 1));

    return {
      strength,
      pattern: dailyAverages,
      peakDay: dailyAverages.indexOf(Math.max(...dailyAverages)),
      lowDay: dailyAverages.indexOf(Math.min(...dailyAverages)),
    };
  }

  /**
   * Detect monthly patterns
   */
  detectMonthlyCycle(dataPoints) {
    // Simplified monthly pattern detection
    const daysInMonth = new Array(31).fill(0);
    const dayCounts = new Array(31).fill(0);

    dataPoints.forEach((point) => {
      const day = new Date(point.timestamp).getDate() - 1; // 0-indexed
      const value = this.extractNumericalValue(point);
      if (day >= 0 && day < 31) {
        daysInMonth[day] += value;
        dayCounts[day]++;
      }
    });

    const dailyAverages = daysInMonth.map((sum, i) => (dayCounts[i] > 0 ? sum / dayCounts[i] : 0));

    const mean =
      dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.filter((v) => v > 0).length;
    const variance =
      dailyAverages.reduce((total, val) => total + Math.pow(val - mean, 2), 0) /
      dailyAverages.filter((v) => v > 0).length;
    const strength = Math.min(1, variance / (mean * mean + 1));

    return {
      strength,
      pattern: dailyAverages,
      peakDay: dailyAverages.indexOf(Math.max(...dailyAverages)),
      lowDay: dailyAverages.indexOf(Math.min(...dailyAverages)),
    };
  }

  /**
   * Detect cross-domain correlations
   */
  detectCorrelations(dataPoints) {
    const correlations = [];
    const dataTypes = [...new Set(dataPoints.map((d) => d.dataType))];

    for (let i = 0; i < dataTypes.length; i++) {
      for (let j = i + 1; j < dataTypes.length; j++) {
        const correlation = this.calculateCorrelation(
          dataPoints.filter((d) => d.dataType === dataTypes[i]),
          dataPoints.filter((d) => d.dataType === dataTypes[j]),
        );

        if (Math.abs(correlation.coefficient) > 0.5) {
          correlations.push({
            dataType1: dataTypes[i],
            dataType2: dataTypes[j],
            coefficient: correlation.coefficient,
            strength: Math.abs(correlation.coefficient),
            direction: correlation.coefficient > 0 ? 'positive' : 'negative',
            confidence: correlation.confidence,
            description: this.generateCorrelationDescription(
              dataTypes[i],
              dataTypes[j],
              correlation,
            ),
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Calculate correlation between two datasets
   */
  calculateCorrelation(data1, data2) {
    // Align data points by timestamp
    const alignedData = this.alignDataByTimestamp(data1, data2);
    if (alignedData.length < 3) return { coefficient: 0, confidence: 0 };

    const values1 = alignedData.map((d) => d.value1);
    const values2 = alignedData.map((d) => d.value2);

    const n = values1.length;
    const mean1 = values1.reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    const coefficient = denominator === 0 ? 0 : numerator / denominator;
    const confidence = Math.min(1, n / 10); // More data points = higher confidence

    return { coefficient, confidence };
  }

  /**
   * Align two datasets by timestamp
   */
  alignDataByTimestamp(data1, data2) {
    const aligned = [];
    const tolerance = 3600000; // 1 hour tolerance

    data1.forEach((point1) => {
      const matchingPoint = data2.find(
        (point2) => Math.abs(point1.timestamp - point2.timestamp) < tolerance,
      );
      if (matchingPoint) {
        aligned.push({
          timestamp: point1.timestamp,
          value1: this.extractNumericalValue(point1),
          value2: this.extractNumericalValue(matchingPoint),
        });
      }
    });

    return aligned;
  }

  /**
   * Generate correlation description
   */
  generateCorrelationDescription(dataType1, dataType2, correlation) {
    const direction = correlation.coefficient > 0 ? 'increase' : 'decrease';
    const strength = Math.abs(correlation.coefficient) > 0.7 ? 'strongly' : 'moderately';

    return `Your ${dataType1} and ${dataType2} data ${strength} correlate - when one ${direction}s, the other tends to ${direction} as well`;
  }

  /**
   * Detect anomalies in data
   */
  detectAnomalies(dataPoints) {
    const anomalies = [];
    const groupedData = this.groupByDataType(dataPoints);

    Object.entries(groupedData).forEach(([dataType, points]) => {
      const statisticalAnomalies = this.detectStatisticalAnomalies(points);
      const contextualAnomalies = this.detectContextualAnomalies(points);

      anomalies.push(
        ...statisticalAnomalies.map((anomaly) => ({
          ...anomaly,
          dataType,
          type: 'statistical',
        })),
      );

      anomalies.push(
        ...contextualAnomalies.map((anomaly) => ({
          ...anomaly,
          dataType,
          type: 'contextual',
        })),
      );
    });

    return anomalies;
  }

  /**
   * Detect statistical anomalies using Z-score
   */
  detectStatisticalAnomalies(dataPoints) {
    const anomalies = [];
    const values = dataPoints.map((d) => this.extractNumericalValue(d));

    if (values.length < 5) return anomalies;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((total, val) => total + Math.pow(val - mean, 2), 0) / values.length,
    );

    const threshold = 2.5; // Z-score threshold

    dataPoints.forEach((point, index) => {
      const value = values[index];
      const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;

      if (Math.abs(zScore) > threshold) {
        anomalies.push({
          dataPoint: point,
          zScore,
          severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
          description: `Unusual ${point.dataType} value of ${value} detected (${Math.abs(zScore).toFixed(1)} standard deviations from normal)`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect contextual anomalies
   */
  detectContextualAnomalies(dataPoints) {
    const anomalies = [];

    // Detect unusual patterns for specific times
    dataPoints.forEach((point) => {
      const temporalFeatures = this.extractTemporalFeatures(point.timestamp);
      const similarTimePoints = dataPoints.filter((p) => {
        const features = this.extractTemporalFeatures(p.timestamp);
        return (
          features.hourOfDay === temporalFeatures.hourOfDay &&
          features.dayOfWeek === temporalFeatures.dayOfWeek &&
          p._id !== point._id
        );
      });

      if (similarTimePoints.length >= 3) {
        const similarValues = similarTimePoints.map((p) => this.extractNumericalValue(p));
        const currentValue = this.extractNumericalValue(point);
        const mean = similarValues.reduce((a, b) => a + b, 0) / similarValues.length;

        if (Math.abs(currentValue - mean) > mean * 0.5) {
          anomalies.push({
            dataPoint: point,
            severity: 'medium',
            description: `Unusual ${point.dataType} pattern for this time of day/week`,
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect clusters in data using K-means
   */
  detectClusters(dataPoints) {
    const clusters = [];
    const groupedData = this.groupByDataType(dataPoints);

    Object.entries(groupedData).forEach(([dataType, points]) => {
      if (points.length >= 5) {
        const clusterAnalysis = this.performKMeansClustering(points, 3); // 3 clusters
        if (clusterAnalysis.valid) {
          clusters.push({
            dataType,
            clusters: clusterAnalysis.clusters,
            silhouette: clusterAnalysis.silhouette,
            description: this.generateClusterDescription(dataType, clusterAnalysis.clusters),
          });
        }
      }
    });

    return clusters;
  }

  /**
   * Perform K-means clustering
   */
  performKMeansClustering(dataPoints, k) {
    const features = dataPoints.map((point) => this.extractFeatures(point));
    const numericalData = features.map((f) => [
      ...f.numericalFeatures.map((nf) => nf.normalized),
      f.temporalFeatures.hourOfDay / 24,
      f.temporalFeatures.dayOfWeek / 7,
    ]);

    if (numericalData.length < k) return { valid: false };

    // Initialize centroids randomly
    let centroids = this.initializeCentroids(numericalData, k);
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const assignments = numericalData.map((point) => this.findClosestCentroid(point, centroids));

      const newCentroids = this.updateCentroids(numericalData, assignments, k);

      if (this.centroidsConverged(centroids, newCentroids)) {
        break;
      }

      centroids = newCentroids;
      iterations++;
    }

    const assignments = numericalData.map((point) => this.findClosestCentroid(point, centroids));

    const clusters = this.createClusters(dataPoints, assignments, k);
    const silhouette = this.calculateSilhouetteScore(numericalData, assignments);

    return {
      valid: true,
      clusters,
      silhouette,
      iterations,
    };
  }

  /**
   * Initialize centroids randomly
   */
  initializeCentroids(data, k) {
    const centroids = [];
    const indices = new Set();

    while (indices.size < k && indices.size < data.length) {
      const index = Math.floor(Math.random() * data.length);
      if (!indices.has(index)) {
        indices.add(index);
        centroids.push([...data[index]]);
      }
    }

    return centroids;
  }

  /**
   * Find closest centroid
   */
  findClosestCentroid(point, centroids) {
    let minDistance = Infinity;
    let closestIndex = 0;

    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(point, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /**
   * Calculate Euclidean distance
   */
  euclideanDistance(point1, point2) {
    return Math.sqrt(point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0));
  }

  /**
   * Update centroids based on assignments
   */
  updateCentroids(data, assignments, k) {
    const centroids = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => assignments[index] === i);

      if (clusterPoints.length > 0) {
        const centroid = clusterPoints[0].map((_, dimIndex) => {
          const sum = clusterPoints.reduce((total, point) => total + point[dimIndex], 0);
          return sum / clusterPoints.length;
        });
        centroids.push(centroid);
      } else {
        // Keep old centroid if no points assigned
        centroids.push(centroids[i] || new Array(data[0].length).fill(0));
      }
    }

    return centroids;
  }

  /**
   * Check if centroids have converged
   */
  centroidsConverged(oldCentroids, newCentroids, threshold = 0.001) {
    return oldCentroids.every((oldCentroid, i) => {
      const newCentroid = newCentroids[i];
      if (!newCentroid) return false;

      return this.euclideanDistance(oldCentroid, newCentroid) < threshold;
    });
  }

  /**
   * Create cluster objects
   */
  createClusters(dataPoints, assignments, k) {
    const clusters = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = dataPoints.filter((_, index) => assignments[index] === i);

      clusters.push({
        id: i,
        size: clusterPoints.length,
        points: clusterPoints,
        center: this.calculateClusterCenter(clusterPoints),
        characteristics: this.analyzeClusterCharacteristics(clusterPoints),
      });
    }

    return clusters;
  }

  /**
   * Calculate cluster center
   */
  calculateClusterCenter(points) {
    if (points.length === 0) return null;

    const values = points.map((p) => this.extractNumericalValue(p));
    return {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev: Math.sqrt(
        values.reduce(
          (total, val) =>
            total + Math.pow(val - values.reduce((a, b) => a + b, 0) / values.length, 2),
          0,
        ) / values.length,
      ),
    };
  }

  /**
   * Analyze cluster characteristics
   */
  analyzeClusterCharacteristics(points) {
    const characteristics = {
      timePatterns: {},
      valuePatterns: {},
      sourcePatterns: {},
    };

    // Analyze time patterns
    const temporalFeatures = points.map((p) => this.extractTemporalFeatures(p.timestamp));
    characteristics.timePatterns = {
      dominantHourOfDay: this.getMostFrequent(temporalFeatures.map((f) => f.hourOfDay)),
      dominantDayOfWeek: this.getMostFrequent(temporalFeatures.map((f) => f.dayOfWeek)),
      dominantTimeOfDay: this.getMostFrequent(temporalFeatures.map((f) => f.timeOfDay)),
    };

    // Analyze source patterns
    characteristics.sourcePatterns = {
      dominantSource: this.getMostFrequent(points.map((p) => p.source)),
    };

    return characteristics;
  }

  /**
   * Get most frequent item in array
   */
  getMostFrequent(arr) {
    const frequency = {};
    arr.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b));
  }

  /**
   * Calculate silhouette score for clustering quality
   */
  calculateSilhouetteScore(data, assignments) {
    if (data.length < 2) return 0;

    let silhouetteSum = 0;

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const cluster = assignments[i];

      // Calculate cohesion (a)
      const sameClusterPoints = data.filter(
        (_, index) => assignments[index] === cluster && index !== i,
      );

      let a = 0;
      if (sameClusterPoints.length > 0) {
        a =
          sameClusterPoints.reduce(
            (sum, otherPoint) => sum + this.euclideanDistance(point, otherPoint),
            0,
          ) / sameClusterPoints.length;
      }

      // Calculate separation (b)
      const clusters = [...new Set(assignments)];
      let b = Infinity;

      clusters.forEach((otherCluster) => {
        if (otherCluster !== cluster) {
          const otherClusterPoints = data.filter((_, index) => assignments[index] === otherCluster);

          if (otherClusterPoints.length > 0) {
            const avgDistance =
              otherClusterPoints.reduce(
                (sum, otherPoint) => sum + this.euclideanDistance(point, otherPoint),
                0,
              ) / otherClusterPoints.length;

            b = Math.min(b, avgDistance);
          }
        }
      });

      // Calculate silhouette for this point
      const silhouette = (b - a) / Math.max(a, b);
      silhouetteSum += isNaN(silhouette) ? 0 : silhouette;
    }

    return silhouetteSum / data.length;
  }

  /**
   * Generate cluster description
   */
  generateClusterDescription(dataType, clusters) {
    const descriptions = clusters.map((cluster, index) => {
      const sizePercent = Math.round(
        (cluster.size / clusters.reduce((sum, c) => sum + c.size, 0)) * 100,
      );
      return `Cluster ${index + 1}: ${sizePercent}% of data points, ${cluster.characteristics.timePatterns.dominantTimeOfDay} patterns`;
    });

    return `Identified ${clusters.length} distinct ${dataType} patterns: ${descriptions.join(', ')}`;
  }

  /**
   * Group data points by type
   */
  groupByDataType(dataPoints) {
    const grouped = {};
    dataPoints.forEach((point) => {
      if (!grouped[point.dataType]) {
        grouped[point.dataType] = [];
      }
      grouped[point.dataType].push(point);
    });
    return grouped;
  }

  /**
   * Predict future trends using linear regression
   */
  predictFutureTrends(dataPoints, horizon = 7) {
    const predictions = {};
    const groupedData = this.groupByDataType(dataPoints);

    Object.entries(groupedData).forEach(([dataType, points]) => {
      const sortedPoints = points.sort((a, b) => a.timestamp - b.timestamp);
      const trend = this.calculateLinearTrend(sortedPoints);

      if (trend.confidence > 0.5) {
        const lastValue = this.extractNumericalValue(sortedPoints[sortedPoints.length - 1]);
        const predictionsList = [];

        for (let i = 1; i <= horizon; i++) {
          const predictedValue = lastValue + trend.slope * i;
          const futureTimestamp = Date.now() + i * 24 * 60 * 60 * 1000; // i days in future

          predictionsList.push({
            timestamp: futureTimestamp,
            value: Math.max(0, predictedValue), // Ensure non-negative
            confidence: trend.confidence * (1 - (i / horizon) * 0.3), // Decrease confidence over time
          });
        }

        predictions[dataType] = {
          trend: trend.slope > 0 ? 'increasing' : 'decreasing',
          confidence: trend.confidence,
          predictions: predictionsList,
          description: this.generatePredictionDescription(dataType, trend, horizon),
        };
      }
    });

    return predictions;
  }

  /**
   * Generate prediction description
   */
  generatePredictionDescription(dataType, trend, horizon) {
    const direction = trend.slope > 0 ? 'improve' : 'decline';
    const strength = Math.abs(trend.slope) > 0.5 ? 'significantly' : 'moderately';

    return `Based on current patterns, your ${dataType} is expected to ${strength} ${direction} over the next ${horizon} days`;
  }

  /**
   * Update user profile with new insights
   */
  updateUserProfile(insights, feedback) {
    // Learn from user feedback
    feedback.forEach((feedback) => {
      const learning = {
        insightId: feedback.insightId,
        userRating: feedback.rating,
        userAction: feedback.action,
        timestamp: Date.now(),
      };
      this.learningHistory.push(learning);
    });

    // Update pattern recognition based on feedback
    this.adjustPatternWeights(feedback);
  }

  /**
   * Adjust pattern weights based on user feedback
   */
  adjustPatternWeights(feedback) {
    feedback.forEach((feedback) => {
      if (feedback.rating > 0.7) {
        // Positive feedback - strengthen similar patterns
        this.strengthenPattern(feedback.insightType);
      } else if (feedback.rating < 0.3) {
        // Negative feedback - weaken similar patterns
        this.weakenPattern(feedback.insightType);
      }
    });
  }

  /**
   * Strengthen pattern weights
   */
  strengthenPattern(patternType) {
    // Implementation for pattern weight strengthening
    console.log(`Strengthening pattern: ${patternType}`);
  }

  /**
   * Weaken pattern weights
   */
  weakenPattern(patternType) {
    // Implementation for pattern weight weakening
    console.log(`Weakening pattern: ${patternType}`);
  }

  /**
   * Get comprehensive pattern analysis
   */
  getPatternAnalysis(dataPoints) {
    return {
      patterns: this.detectPatterns(dataPoints),
      predictions: this.predictFutureTrends(dataPoints),
      userProfile: this.getUserProfileSummary(),
      confidence: this.calculateOverallConfidence(dataPoints),
    };
  }

  /**
   * Get user profile summary
   */
  getUserProfileSummary() {
    return {
      totalDataPoints: this.learningHistory.length,
      averageRating:
        this.learningHistory.length > 0
          ? this.learningHistory.reduce((sum, h) => sum + h.userRating, 0) /
            this.learningHistory.length
          : 0,
      preferredInsightTypes: this.getPreferredInsightTypes(),
      learningProgress: this.calculateLearningProgress(),
    };
  }

  /**
   * Get preferred insight types
   */
  getPreferredInsightTypes() {
    // Analyze which insight types user prefers based on feedback
    return {
      mostValued: 'health',
      leastValued: 'finance',
      preferences: {},
    };
  }

  /**
   * Calculate learning progress
   */
  calculateLearningProgress() {
    return Math.min(1, this.learningHistory.length / 100); // Progress based on feedback count
  }

  /**
   * Calculate overall confidence
   */
  calculateOverallConfidence(dataPoints) {
    const dataQuality = this.assessDataQuality(dataPoints);
    const dataVolume = Math.min(1, dataPoints.length / 50); // More data = higher confidence
    const patternStrength = 0.8; // Based on detected patterns

    return (dataQuality + dataVolume + patternStrength) / 3;
  }

  /**
   * Assess data quality
   */
  assessDataQuality(dataPoints) {
    if (dataPoints.length === 0) return 0;

    // Check data completeness, consistency, and recency
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentData = dataPoints.filter((d) => d.timestamp > thirtyDaysAgo);

    const recencyScore = recentData.length / dataPoints.length;
    const varietyScore = [...new Set(dataPoints.map((d) => d.dataType))].length / 6; // 6 is max data types
    const consistencyScore = this.calculateDataConsistency(dataPoints);

    return (recencyScore + varietyScore + consistencyScore) / 3;
  }

  /**
   * Calculate data consistency
   */
  calculateDataConsistency(dataPoints) {
    // Simple consistency check based on value ranges
    const groupedData = this.groupByDataType(dataPoints);
    let consistencySum = 0;
    let typeCount = 0;

    Object.values(groupedData).forEach((points) => {
      if (points.length > 1) {
        const values = points.map((p) => this.extractNumericalValue(p));
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
          values.reduce((total, val) => total + Math.pow(val - mean, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / mean; // Coefficient of variation

        // Lower CV = more consistent
        consistencySum += Math.max(0, 1 - cv);
        typeCount++;
      }
    });

    return typeCount > 0 ? consistencySum / typeCount : 0.5;
  }
}

export default PatternRecognitionEngine;
