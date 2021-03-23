import React, { ReactElement, useEffect, useRef } from 'react';
import { Labels, PanelProps, Field } from '@grafana/data';
import { Position, TrackMapOptions, AntData } from 'types';
import { css, cx } from 'emotion';
import { Feature, FeatureCollection } from 'geojson';
import { Map, Marker, Popup, TileLayer, Tooltip, withLeaflet } from 'react-leaflet';
import { DivIcon, LatLngBounds, LatLngBoundsExpression, LeafletEvent } from 'leaflet';
import './leaflet.css';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { getLocationSrv } from '@grafana/runtime';
import { stylesFactory } from '@grafana/ui';

const AntPath = require('react-leaflet-ant-path').default;
const HeatmapLayer = require('react-leaflet-heatmap-layer').default;
const HexbinLayer = require('react-leaflet-d3').HexbinLayer;

interface Props extends PanelProps<TrackMapOptions> {}

const StyledPopup = styled(Popup)`
  .leaflet-popup-content-wrapper {
    white-space: pre-wrap;
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
    if (mapRef.current !== null) {
      if (options.map.zoomToDataBounds) {
        const bounds = getBoundsFromPositions(positions);
        mapRef.current.leafletElement.fitBounds(bounds, { animate: false });
      }
      const bounds = mapRef.current.leafletElement.getBounds();
      updateMap(bounds);
    }
    // eslint-disable-next-line
  }, []);

  const getAntPathColorOverridesMemoized = (): (() => { [key: string]: string }) => {
    let antPathColorOverrides: { [key: string]: string } = {};
    return () => {
      if (Object.keys(antPathColorOverrides).length === 0) {
        if (options.ant.colorOverridesByLabel?.length) {
          options.ant.colorOverridesByLabel.forEach((labelColor) => {
            antPathColorOverrides[labelColor.label] = labelColor.color;
          });
        }
      }
      return antPathColorOverrides;
    };
  };

  const getMarkerHtmlOverridesMemoized = (): (() => { [key: string]: string }) => {
    let markerHtmlOverrides: { [key: string]: string } = {};
    return () => {
      if (Object.keys(markerHtmlOverrides).length === 0) {
        if (options.marker.markerHtmlByLabel?.length) {
          options.marker.markerHtmlByLabel.forEach((keyVal) => {
            markerHtmlOverrides[keyVal.key] = keyVal.value;
          });
        }
      }
      return markerHtmlOverrides;
    };
  };

  const getAntPathColorOverrides = getAntPathColorOverridesMemoized();

  const getMarkerHtmlOverrides = getMarkerHtmlOverridesMemoized();

  const tracksIndex: Record<string, number> = data.series
    .reduce((fields, serie) => fields.concat(serie.fields), [] as any[])
    .map((field) => field.labels && field.labels['track'])
    .filter((track) => track !== undefined)
    .reduce((tracks, track, index) => (tracks[track] === undefined ? { ...tracks, [track]: index } : tracks), {});

  let timestampsData: number[][] | undefined = data.series
    .reduce((a, s) => a.concat(s.fields), [] as any[])
    .filter((f) => f.name === 'timestamp' || f.name === 'time')
    .map((f) => f.values?.toArray() as number[]);

  let latitudesData: number[][][] | undefined = data.series.map((s) =>
    s.fields.filter((f) => f.name === 'latitude' || f.name === 'lat').map((f) => f.values?.toArray() as number[])
  );

  let longitudesData: number[][][] | undefined = data.series.map((s) =>
    s.fields.filter((f) => f.name === 'longitude' || f.name === 'lon').map((f) => f.values?.toArray() as number[])
  );

  let labelsData: Array<Array<Labels | undefined>> = data.series.map((s) =>
    s.fields.filter((f) => f.name === 'latitude' || f.name === 'lat').map((f) => f.labels)
  );

  let intensitiesData: number[][][] | undefined = data.series.map((s) =>
    s.fields.filter((f) => f.name === 'intensity').map((f) => f.values?.toArray() as number[])
  );

  let markerPopupsData: string[][][] | undefined = data.series.map((s) =>
    s.fields
      .filter((f) => f.name === 'popup' || f.name === 'text' || f.name === 'desc')
      .map((f) => f.values?.toArray() as string[])
  );

  let markerTooltipsData: string[][][] | undefined = data.series.map((s) =>
    s.fields.filter((f) => f.name === 'tooltip').map((f) => f.values?.toArray() as string[])
  );

  let latitudes: number[][] | undefined = [] as number[][];
  let longitudes: number[][] | undefined = [] as number[][];
  let timestamps: number[][] | undefined = [] as number[][];
  let labels: Array<Labels | undefined> = [] as Labels[];
  let intensities: number[][] | undefined = [] as number[][];
  let markerPopups: string[][] | undefined = [] as string[][];
  let markerTooltips: string[][] | undefined = [] as string[][];

  timestampsData?.forEach((ts, i) => {
    ts.forEach((t, j) => {
      const ll = labelsData && labelsData[i][0];
      const track = ll && ll['track'];
      let trackIndex = 0;
      if (track && tracksIndex[track] > 0) {
        trackIndex = tracksIndex[track];
      }
      if (latitudes && latitudesData) {
        if (latitudes[trackIndex] !== undefined) {
	  latitudes[trackIndex] = [...latitudes[trackIndex], latitudesData[i][trackIndex][j]];
        } else {
          latitudes[trackIndex] = [latitudesData[i][trackIndex][j]];
        }
      }
      if (longitudes && longitudesData) {
        if (longitudes[trackIndex] !== undefined) {
	  longitudes[trackIndex] = [...longitudes[trackIndex], longitudesData[i][trackIndex][j]];
        } else {
          longitudes[trackIndex] = [longitudesData[i][trackIndex][j]];
        }
      }
      if (timestamps && timestampsData) {
        if (timestamps[trackIndex] !== undefined) {
	  timestamps[trackIndex].push(t);
        } else {
          timestamps[trackIndex] = [t];
        }
      }
      if (labels) {
        labels[trackIndex] = ll;
      }
      //if (intensities && intensitiesData) {
        //if (intensities[trackIndex] !== undefined) {
	  //intensities[trackIndex] = [...intensities[trackIndex], intensitiesData[i][trackIndex][j]];
        //} else {
          //intensities[trackIndex] = [intensitiesData[i][trackIndex][j]];
        //}
      //}
      //if (markerPopups && markerPopupsData) {
        //if (markerPopups[trackIndex] !== undefined) {
	  //markerPopups[trackIndex] = [...markerPopups[trackIndex], markerPopupsData[i][trackIndex][j]];
        //} else {
          //markerPopups[trackIndex] = [markerPopupsData[i][trackIndex][j]];
        //}
      //}
      //if (markerTooltips && markerTooltipsData) {
        //if (markerTooltips[trackIndex] !== undefined) {
	  //markerTooltips[trackIndex] = [...markerTooltips[trackIndex], markerTooltipsData[i][trackIndex][j]];
        //} else {
          //markerTooltips[trackIndex] = [markerTooltipsData[i][trackIndex][j]];
        //}
      //}
    });
  });

  let liveness: boolean[] = latitudes.map((ls) => ls[ls.length - 1] !== null);

  let iconHtml: Array<string | undefined> | undefined;

  if (labels && labels.length) {
    iconHtml = labels.map((l: Labels | undefined) => {
      const overrides = getMarkerHtmlOverrides();
      if (l && l[options.marker.labelName] && overrides[l[options.marker.labelName]]) {
        return overrides[l[options.marker.labelName]];
      }
      return undefined;
    });
  }

  let positions: Position[][] = [];
  latitudes?.forEach((lats, index1) => {
    positions[index1] = [] as Position[];
    lats.forEach((latitude, index2) => {
      const longitude =
        longitudes !== undefined && longitudes.length && longitudes[index1] !== undefined
          ? longitudes[index1][index2]
          : 0;

      const timestamp =
        timestamps !== undefined && timestamps.length && timestamps[index1] !== undefined
          ? timestamps[index1][index2]
          : 0;

      const trackLabels = labels && labels[index1] ? labels[index1] : undefined;

      const popup =
        markerPopups !== undefined && markerPopups.length && markerPopups[index1] !== undefined
          ? markerPopups[index1][index2]
          : `LatLon: (${latitude}, ${longitude})
Timestamp: ${timestamp}
Labels:
${trackLabels ? JSON.stringify(trackLabels, null, 2) : ''}
`;
      const tooltip =
        markerTooltips !== undefined && markerTooltips.length && markerTooltips[index1] !== undefined
          ? markerTooltips[index1][index2]
          : undefined;
      // const icon = iconNames !== undefined ? iconNames[index1][index2] : undefined;
      positions[index1].push({
        latitude,
        longitude,
        popup,
        tooltip,
        labels: trackLabels,
        // icon,
      });
    });
  });

  if (!positions || positions.length === 0) {
    positions = [[{ latitude: 0, longitude: 0 }]];
  }

  const heatData: any[][] = [];
  const antData: AntData[] = [];
  const hexData: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  positions?.forEach((ps, i) => {
    const antDatas: number[][] = [];

    const antOptions = {
      delay: options.ant.delay,
      dashArray: [10, 20],
      weight: options.ant.weight,
      color: options.ant.color,
      pulseColor: options.ant.pulseColor,
      paused: options.ant.paused,
      reverse: options.ant.reverse,
    };

    if (options.ant.pauseNonLiveTracks && !liveness[i]) {
      antOptions.paused = true;
    }

    const currentLabels = labels[i];
    if (options.ant.labelName && currentLabels && currentLabels[options.ant.labelName]) {
      const override = getAntPathColorOverrides()[currentLabels[options.ant.labelName]];
      if (override) {
        antOptions.color = override;
      }
    }

    const heatDatas: any[] = [];
    ps.forEach((p) => {
      // These may be null for alignment purposes in the timeseries data
      if (p.latitude && p.longitude) {
        heatDatas.push([p.latitude, p.longitude, intensities !== undefined ? intensities[i] : '']);
        antDatas.push([p.latitude, p.longitude]);
        hexData.features.push({
          type: 'Feature',
          id: i,
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude],
          },
        } as Feature);
      }
    });
    heatData.push(heatDatas);
    antData.push({
      options: antOptions,
      data: antDatas,
    });
  });

  const createMarkers = (
    positions: Position[][],
    showOnlyLastMarker: boolean,
    showOnlyLiveTracks: boolean,
    alwaysShowTooltips: boolean
  ): ReactElement[] => {
    let markers: ReactElement[] = [];
    if (positions?.length > 0) {
      positions.forEach((ps, i) => {
        ps = ps.filter((p) => p.latitude);
        ps.forEach((p, j) => {
          const isLastPosition = j + 1 === ps?.length;
          let html = options.marker.defaultHtml;
          if (iconHtml && iconHtml.length) {
            const maybeHtml = iconHtml[i];
            if (maybeHtml !== undefined) {
              html = maybeHtml;
            }
          }
          const icon: DivIcon = createIcon(html, options.marker.size);
          let shouldShow = true;
          if (showOnlyLastMarker) {
            if (!isLastPosition) {
              shouldShow = false;
            }
            if (showOnlyLiveTracks && !liveness[i]) {
              shouldShow = false;
            }
          }
          if (shouldShow && p.latitude && p.longitude) {
            markers.push(
              <Marker key={i + '-' + j} position={[p.latitude, p.longitude]} icon={icon} title={p.popup}>
                <StyledPopup>{p.popup}</StyledPopup>
                {p.tooltip && <Tooltip permanent={alwaysShowTooltips}>{p.tooltip}</Tooltip>}
              </Marker>
            );
          }
        });
      });
    }
    return markers;
  };

  const createIcon = (html: string, size: number) => {
    return new DivIcon({
      html: html,
      iconSize: [size, size],
      iconAnchor: [size * 0.5, size],
      popupAnchor: [0, -size],
    });
  };

  const markers: ReactElement[] = createMarkers(
    positions,
    options.marker.showOnlyLastMarker,
    options.marker.showOnlyLiveTracks,
    options.marker.alwaysShowTooltips
  );

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
    if (options.map.useBoundsInQuery) {
      updateQueryVariables(minLat, minLon, maxLat, maxLon);
    }
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
  const mapCenter: Position = {
    latitude: options.map.centerLatitude,
    longitude: options.map.centerLongitude,
  };
  if (options.map.useCenterFromFirstPos && positions?.length && positions[0]?.length && positions[0][0].latitude) {
    mapCenter.latitude = positions[0][0].latitude;
    mapCenter.longitude = positions[0][0].longitude;
  }

  if (positions?.length && positions[0]?.length && positions[0][0]) {
    if (options.map.useCenterFromFirstPos && positions[0][0].latitude) {
      mapCenter.latitude = positions[0][0].latitude;
      mapCenter.longitude = positions[0][0].longitude;
    }
    if (
      !options.map.useCenterFromFirstPos &&
      options.map.useCenterFromLastPos &&
      positions[0][positions[0].length - 1].latitude
    ) {
      mapCenter.latitude = positions[0][positions.length - 1].latitude;
      mapCenter.longitude = positions[0][positions.length - 1].longitude;
    }
  }
  let antPaths = null;
  if (options.viewType === 'ant' || options.viewType === 'ant-marker') {
    antPaths = antData.map((d, i) => {
      if (d.data.length && d.data.length > 1) {
        const popup = positions ? positions[i].find((p) => p.latitude && p.longitude)?.popup : undefined;
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
        ref={mapRef}
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={options.map.zoom}
        zoomSnap={0.5}
        onmoveend={(event: LeafletEvent) => {
          onMapMoveEnd(event);
        }}
      >
        {antPaths}
        {options.viewType === 'heat' && (
          <HeatmapLayer
            fitBoundsOnLoad={options.heat.fitBoundsOnLoad}
            fitBoundsOnUpdate={options.heat.fitBoundsOnUpdate}
            points={heatData}
            longitudeExtractor={(m: any) => m[1]}
            latitudeExtractor={(m: any) => m[0]}
            intensityExtractor={(m: any) => parseFloat(m[2])}
          />
        )}
        {options.viewType === 'hex' && <WrappedHexbinLayer {...hexbinOptions} data={hexData} />}
        {(options.viewType === 'marker' || options.viewType === 'ant-marker') && markers}
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
