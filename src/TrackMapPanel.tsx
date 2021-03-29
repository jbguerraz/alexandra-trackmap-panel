import React, { ReactElement, useEffect, useRef } from 'react';
import { Labels, PanelProps, Field } from '@grafana/data';
import { Position, TrackMapOptions, AntData } from 'types';
import { css, cx } from 'emotion';
import { Feature, FeatureCollection } from 'geojson';
import { CircleMarker, Map, Marker, Popup, TileLayer, Tooltip, withLeaflet } from 'react-leaflet';
import { DivIcon, LatLngBounds, LatLngBoundsExpression, LeafletEvent } from 'leaflet';
import './leaflet.css';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { getLocationSrv } from '@grafana/runtime';
import { stylesFactory } from '@grafana/ui';
import { LabelColor } from './colorMapEditor';

const AntPath = require('react-leaflet-ant-path').default;
const HeatmapLayer = require('react-leaflet-heatmap-layer').default;
const HexbinLayer = require('react-leaflet-d3').HexbinLayer;

interface Props extends PanelProps<TrackMapOptions> {}

const StyledPopup = styled(Popup)`
  .leaflet-popup-content-wrapper {
    white-space: pre-wrap;
    color: black !important;
  }

  .leaflet-popup-tip-container {
    visibility: hidden;
  }
`;

export const TrackMapPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = getStyles();
  const mapRef = useRef<Map | null>(null);

  const WrappedHexbinLayer: any = withLeaflet(HexbinLayer);

  useEffect(() => {
    fitDataBounds();
  });

  interface SeriePositions {
    name: string;
    positions: Position[];
  }
  let serieViewTypes: { [serie: string]: string[] } = {};
  let tracks: { [track: string]: SeriePositions } = {};
  let labels: Array<Labels | undefined> = [] as Labels[];
  let intensities: number[][] = [] as number[][];

  data.series.forEach((s, sIdx) => {
    let serieName = '';
    if (s.refId !== undefined) {
      serieName = s.refId;
      serieViewTypes[serieName] = [];
    }
    let trackss = s.fields.filter((f) => f.name === 'track')[0].values.toArray() as string[];
    let latitudes = s.fields.filter((f) => f.name === 'latitude')[0].values.toArray() as number[];
    let longitudes = s.fields.filter((f) => f.name === 'longitude')[0].values.toArray() as number[];
    intensities.push(s.fields.filter((f) => f.name === 'intensity')[0].values.toArray() as number[]);
    let popups = s.fields.filter((f) => f.name === 'popup')[0].values.toArray() as string[];
    let tooltips = s.fields.filter((f) => f.name === 'tooltip')[0].values.toArray() as string[];
    s.fields
      .filter((f) => f.name === 'timestamp')[0]
      .values?.toArray()
      .forEach((t, trackIdx) => {
        let track = trackss[trackIdx];
        let latitude = latitudes[trackIdx];
        let longitude = longitudes[trackIdx];
        let popup = popups[trackIdx]; //.replaceAll('\\n', '\n');;
        let tooltip = tooltips[trackIdx]; //.replaceAll('\\n', '\n');
        let labels: Labels = {};
        if (tracks[track] === undefined) {
          tracks[track] = {} as SeriePositions;
          tracks[track].positions = [] as Position[];
        }
        tracks[track].name = serieName;
        tracks[track].positions.push({
          latitude,
          longitude,
          popup,
          tooltip,
          labels,
        });
      });
  });
  let i = 0;
  let positions: SeriePositions[] = [];
  for (let track in tracks) {
    positions[i] = tracks[track];
    labels[i] = tracks[track].positions[0].labels;
    i = i + 1;
  }
  options.viewTypes.includes('marker') && options.marker.queries.forEach((q) => serieViewTypes[q].push('marker'));
  options.viewTypes.includes('ant') && options.ant.queries.forEach((q) => serieViewTypes[q].push('ant'));
  options.viewTypes.includes('heat') && options.heat.queries.forEach((q) => serieViewTypes[q].push('heat'));
  options.viewTypes.includes('hex') && options.hex.queries.forEach((q) => serieViewTypes[q].push('hex'));

  const heatData: any[][] = [];
  const antData: AntData[] = [];
  const hexData: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  positions?.forEach((ps, i) => {
    const antDatas: number[][] = [];
    let color = options.ant.color;
    let overrideColor = options.ant.colorOverridesByQuery.filter((c) => c.label === ps.name);
    if (overrideColor.length === 1) {
      color = overrideColor[0].color;
    }

    const antOptions = {
      delay: options.ant.delay,
      dashArray: [20, 5],
      weight: options.ant.weight,
      color: color,
      pulseColor: options.ant.pulseColor,
      opacity: options.ant.opacity,
      paused: options.ant.paused,
      reverse: options.ant.reverse,
      lineCap: 'butt',
    };

    const heatDatas: any[] = [];
    ps.positions.forEach((p) => {
      // These may be null for alignment purposes in the timeseries data
      if (p.latitude && p.longitude) {
        if (options.viewTypes.includes('heat') && options.heat.queries.includes(ps.name)) {
          heatDatas.push([p.latitude, p.longitude, intensities !== undefined ? intensities[i] : '']);
        }
        if (options.viewTypes.includes('ant') && options.ant.queries.includes(ps.name)) {
          antDatas.push([p.latitude, p.longitude]);
        }
        if (options.viewTypes.includes('hex') && options.hex.queries.indexOf(ps.name) > -1) {
          hexData.features.push({
            type: 'Feature',
            id: i,
            geometry: {
              type: 'Point',
              coordinates: [p.longitude, p.latitude],
            },
          } as Feature);
        }
      }
    });
    heatData.push(heatDatas);
    antData.push({
      options: antOptions,
      data: antDatas,
    });
  });

  const createMarkers = (positions: SeriePositions[], colorOverridesByQuery: LabelColor[]): ReactElement[] => {
    let markers: ReactElement[] = [];
    if (positions?.length > 0) {
      positions.forEach((ps, i) => {
        if (options.viewTypes.includes('marker') && options.marker.queries.includes(ps.name)) {
          let color = options.marker.color;
          let overrideColor = options.marker.colorOverridesByQuery.filter((c) => c.label === ps.name);
          if (overrideColor.length === 1) {
            color = overrideColor[0].color;
          }
          let size = options.marker.size;
          ps.positions.forEach((p, j) => {
            if (p.latitude && p.longitude) {
              markers.push(
                <CircleMarker center={[p.latitude, p.longitude]} radius={size} color={color}>
                  <Popup>
                    <div style={{ whiteSpace: 'pre-line' }}>{p.popup}</div>
                  </Popup>
                  <Tooltip>
                    <div style={{ whiteSpace: 'pre-line' }}>{p.popup}</div>
                  </Tooltip>
                </CircleMarker>
              );
            }
          });
        }
      });
    }
    return markers;
  };

  const markers: ReactElement[] = createMarkers(positions, options.marker.colorOverridesByQuery);

  const hexbinOptions = {
    colorScaleExtent: [1, undefined],
    radiusScaleExtent: [1, undefined],
    colorRange: [options.hex.colorRangeFrom, options.hex.colorRangeTo],
    radiusRange: [options.hex.radiusRangeFrom, options.hex.radiusRangeTo],
  };

  const onMapMoveEnd = (event: LeafletEvent) => {
    if (mapRef.current !== null) {
      mapRef.current.leafletElement.invalidateSize();
    }
    updateMap(event.target.getBounds());
  };

  const updateQueryVariables = (minLat: number, minLon: number, maxLat: number, maxLon: number) => {
    getLocationSrv().update({
      query: {
        'var-minLat': minLat,
        'var-maxLat': maxLat,
        'var-minLon': minLon,
        'var-maxLon': maxLon,
      },
      partial: true,
      replace: true,
    });
  };

  const updateMap = (bounds: LatLngBounds) => {
    const minLat = bounds.getSouthWest().lat;
    const minLon = bounds.getSouthWest().lng;
    const maxLat = bounds.getNorthEast().lat;
    const maxLon = bounds.getNorthEast().lng;
    updateQueryVariables(minLat, minLon, maxLat, maxLon);
  };

  const getBoundsFromPositions = (positions: Position[][] | undefined): LatLngBoundsExpression => {
    if (positions) {
      const minLon = Math.min(...positions?.map((ps) => ps.map((p) => p.longitude).flat()).flat());
      const maxLon = Math.max(...positions?.map((ps) => ps.map((p) => p.longitude).flat()).flat());
      const minLat = Math.min(...positions?.map((ps) => ps.map((p) => p.latitude).flat()).flat());
      const maxLat = Math.max(...positions?.map((ps) => ps.map((p) => p.latitude).flat()).flat());
      return [
        [minLat, minLon],
        [maxLat, maxLon],
      ];
    } else {
      return [
        [-180, 180],
        [-180, 180],
      ];
    }
  };

  const fitDataBounds = () => {
    if (mapRef.current !== null) {
      let pp = positions
        .filter((p) => {
          let viewTypes = serieViewTypes[p.name];
          if (viewTypes) {
            if (
              options.viewTypes.includes('marker') &&
              viewTypes.includes('marker') &&
              options.marker.zoomToDataBounds
            ) {
              return true;
            }
            if (options.viewTypes.includes('ant') && viewTypes.includes('ant') && options.ant.zoomToDataBounds) {
              return true;
            }
          }
          return false;
        })
        .map((p) => p.positions);
      if (pp.length > 0) {
        let bounds = getBoundsFromPositions(pp);
        mapRef.current.leafletElement.fitBounds(bounds, { animate: false });
        bounds = mapRef.current.leafletElement.getBounds();
        updateMap(bounds);
      }
    }
  };
  fitDataBounds();
  //useEffect(() => {
  // eslint-disable-next-line
  //}, []);

  // FIT TO DATA
  //if (mapRef.current !== null) {
  //  console.log('PLOOOOOOOOOOOOOP');
  //  //if (options.ant.zoomToDataBounds) {
  //  let bounds = getBoundsFromPositions(positions.map((p) => p.positions));
  //  mapRef.current.leafletElement.fitBounds(bounds, { animate: false });
  //  //}
  //  bounds = mapRef.current.leafletElement.getBounds();
  //  updateMap(bounds);
  //}
  //

  const mapCenter: Position = {
    latitude: options.map.centerLatitude,
    longitude: options.map.centerLongitude,
  };

  let antPaths = null;
  if (options.viewTypes.includes('ant')) {
    antPaths = antData.map((d, i) => {
      if (d.data.length && d.data.length > 1) {
        const popup = positions ? positions[i].positions.find((p) => p.latitude && p.longitude)?.popup : undefined;
        return (
          <AntPath key={i} positions={d.data} options={d.options}>
            {popup ? <StyledPopup>{popup}</StyledPopup> : null}
          </AntPath>
        );
      } else {
        return null;
      }
    });
  }
  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <Map
        preferCanvas={true}
        ref={mapRef}
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={options.map.zoom}
        zoomSnap={0.5}
        onmoveend={(event: LeafletEvent) => {
          onMapMoveEnd(event);
        }}
      >
        {options.viewTypes.includes('hex') && <WrappedHexbinLayer {...hexbinOptions} data={hexData} />}
        {antPaths}
        {options.viewTypes.includes('heat') && (
          <HeatmapLayer
            fitBoundsOnLoad={options.heat.fitBoundsOnLoad}
            fitBoundsOnUpdate={options.heat.fitBoundsOnUpdate}
            points={heatData}
            longitudeExtractor={(m: any) => m[1]}
            latitudeExtractor={(m: any) => m[0]}
            intensityExtractor={(m: any) => parseFloat(m[2])}
          />
        )}
        {options.viewTypes.includes('marker') && markers}
        <TileLayer
          attribution={options.map.tileAttribution}
          url={options.map.tileUrl}
          accessToken={options.map.tileAccessToken !== '' ? options.map.tileAccessToken : undefined}
          maxZoom={25}
          maxNativeZoom={19}
          subdomains={
            options.map.tileSubDomains && options.map.tileSubDomains.length ? options.map.tileSubDomains : undefined
          }
        />
      </Map>
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
  };
});
