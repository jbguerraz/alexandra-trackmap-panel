import { Labels } from '@grafana/data';
import { LabelColor } from './colorMapEditor';
import { KeyValueString } from './stringMapEditor';
import { KeyValueNumber } from './numberMapEditor';

type ViewType = 'ant' | 'hex' | 'heat' | 'marker';

export interface TrackMapOptions {
  text: string;
  map: Map;
  viewTypes: ViewType[];
  ant: AntOptions;
  heat: HeatOptions;
  marker: MarkerOptions;
  hex: HexOptions;
}

interface Map {
  tileUrl: string;
  tileAttribution: string;
  tileAccessToken: string;
  tileSubDomains: string[];
  centerLatitude: number;
  centerLongitude: number;
  zoom: number;
}

export interface AntOptions {
  queries: string[];
  delay: number;
  weight: number;
  color: string;
  pulseColor: string;
  opacity: number;
  paused: boolean;
  reverse: boolean;
  colorOverridesByQuery: LabelColor[];
  zoomToDataBounds: boolean;
}

export interface AntData {
  options: any;
  data: number[][];
}

interface HeatOptions {
  queries: string[];
  fitBoundsOnLoad: boolean;
  fitBoundsOnUpdate: boolean;
}

interface MarkerOptions {
  queries: string[];
  color: string;
  size: number;
  colorOverridesByQuery: LabelColor[];
  sizeOverridesByQuery: KeyValueNumber[];
  zoomToDataBounds: boolean;
}

interface HexOptions {
  queries: string[];
  opacity: number;
  colorRangeFrom: string;
  colorRangeTo: string;
  radiusRangeFrom: number;
  radiusRangeTo: number;
}

export interface Position {
  latitude: number;
  longitude: number;
  popup?: string;
  tooltip?: string;
  labels?: Labels;
  icon?: string;
}
