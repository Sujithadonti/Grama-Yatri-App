import { Timestamp } from 'firebase/firestore';

export interface Route {
  id: string;
  name: string;
  description?: string;
}

export interface Stop {
  id: string;
  name: string;
  order: number;
  avgTravelTimeFromPrev: number; // in minutes
}

export interface Report {
  id: string;
  routeId: string;
  stopId: string;
  type: 'ARRIVED' | 'PASSED' | 'ON_BUS';
  crowdLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: Timestamp;
  reporterName: string;
  userId: string;
}

export interface Alert {
  id: string;
  routeId: string;
  message: string;
  timestamp: Timestamp;
  reporterName: string;
  userId: string;
}
