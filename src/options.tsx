import { PanelOptionsEditorBuilder, standardEditorsRegistry } from '@grafana/data';
import { TrackMapOptions } from './types';

import React from 'react';
import ColorMapEditor from './colorMapEditor';
import NumberMapEditor from './numberMapEditor';

export const optionsBuilder = (builder: PanelOptionsEditorBuilder<TrackMapOptions>) => {
  return (
    builder
      .addTextInput({
        category: ['Map'],
        path: 'map.tileUrl',
        name: 'URL template for tileserver',
        defaultValue: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      })
      .addTextInput({
        category: ['Map'],
        path: 'map.tileAttribution',
        name: 'Attribution HTML for tiles',
        defaultValue: '&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTextInput({
        category: ['Map'],
        path: 'map.tileAccessToken',
        name: 'Access token for tile server',
        defaultValue: '',
      })
      .addStringArray({
        category: ['Map'],
        path: 'map.tileSubDomains',
        name: 'Tile server subdomains',
        defaultValue: ['a', 'b', 'c'],
      })
      .addNumberInput({
        category: ['Map'],
        path: 'map.centerLatitude',
        name: 'Map center latitude',
        defaultValue: 56.17203,
      })
      .addNumberInput({
        category: ['Map'],
        path: 'map.centerLongitude',
        name: 'Map center longitude',
        defaultValue: 10.1865203,
      })
      .addNumberInput({
        category: ['Map'],
        path: 'map.zoom',
        name: 'Map Zoom',
        defaultValue: 10,
      })
      .addMultiSelect({
        path: 'viewTypes',
        defaultValue: 'marker',
        name: 'Visualisation types',
        settings: {
          options: [
            {
              value: 'marker',
              label: 'Markers',
            },
            {
              value: 'ant',
              label: 'Ant Path',
            },
            {
              value: 'hex',
              label: 'Hexbin',
            },
            {
              value: 'heat',
              label: 'Heatmap',
            },
          ],
        },
      })
      //ant
      .addStringArray({
        category: ['Ant Path'],
        path: 'ant.queries',
        name: 'Queries',
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addNumberInput({
        category: ['Ant Path'],
        path: 'ant.delay',
        name: 'Delay',
        defaultValue: 400,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addNumberInput({
        category: ['Ant Path'],
        path: 'ant.weight',
        name: 'Weight',
        defaultValue: 5,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addColorPicker({
        category: ['Ant Path'],
        path: 'ant.color',
        name: 'Color',
        defaultValue: 'rgba(0, 100, 255, 1)',
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addColorPicker({
        category: ['Ant Path'],
        path: 'ant.pulseColor',
        name: 'Pulse color',
        defaultValue: 'rgba(0, 100, 255, 0.2)',
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addSliderInput({
        category: ['Ant Path'],
        path: 'ant.opacity',
        name: 'Opacity',
        settings: {
          max: 1,
          min: 0,
          step: 0.1,
        },
        defaultValue: 0.8,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.paused',
        name: 'Paused',
        defaultValue: false,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.reverse',
        name: 'Reverse',
        defaultValue: false,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addCustomEditor({
        id: 'ant.colorOverridesByQuery',
        category: ['Ant Path'],
        path: 'ant.colorOverridesByQuery',
        name: 'Color by query',
        editor: ColorMapEditor as any,
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.zoomToDataBounds',
        name: 'Zoom map to fit data bounds',
        defaultValue: true,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('ant'),
      })
      //heat
      .addStringArray({
        category: ['Heat Map'],
        path: 'heat.queries',
        name: 'Queries',
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('heat'),
      })
      .addBooleanSwitch({
        category: ['Heat Map'],
        path: 'heat.fitBoundsOnLoad',
        name: 'Fit bounds on load',
        defaultValue: false,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('heat'),
      })
      .addBooleanSwitch({
        category: ['Heat Map'],
        path: 'heat.fitBoundsOnUpdate',
        name: 'Fit bounds on update',
        defaultValue: false,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('heat'),
      })
      //marker
      .addStringArray({
        category: ['Markers'],
        path: 'marker.queries',
        name: 'Queries',
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('marker'),
      })
      .addColorPicker({
        category: ['Markers'],
        path: 'marker.color',
        name: 'Color',
        defaultValue: 'rgba(0, 100, 255, 0.2)',
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('marker'),
      })
      .addNumberInput({
        category: ['Markers'],
        path: 'marker.size',
        name: 'Size',
        defaultValue: 25,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('marker'),
      })
      .addCustomEditor({
        id: 'marker.colorOverridesByQuery',
        category: ['Markers'],
        path: 'marker.colorOverridesByQuery',
        name: 'Color by query',
        editor: ColorMapEditor as any,
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('marker'),
      })
      .addCustomEditor({
        id: 'marker.sizeOverridesByQuery',
        category: ['Markers'],
        path: 'marker.sizeOverridesByQuery',
        name: 'Size by query',
        editor: NumberMapEditor as any,
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('marker'),
      })
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.zoomToDataBounds',
        name: 'Zoom map to fit data bounds',
        defaultValue: true,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('marker'),
      })
      //hex
      .addStringArray({
        category: ['HexBin'],
        path: 'hex.queries',
        name: 'Queries',
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('hex'),
      })
      .addNumberInput({
        category: ['HexBin'],
        path: 'hex.opacity',
        name: 'Opacity',
        defaultValue: 0.6,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('hex'),
      })
      .addTextInput({
        category: ['HexBin'],
        path: 'hex.colorRangeFrom',
        name: 'Color range from (hex)',
        defaultValue: '#f7fbff',
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('hex'),
      })
      .addTextInput({
        category: ['HexBin'],
        path: 'hex.colorRangeTo',
        name: 'Color range to (hex)',
        defaultValue: '#ff0000',
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('hex'),
      })
      .addNumberInput({
        category: ['HexBin'],
        path: 'hex.radiusRangeFrom',
        name: 'Radius range from',
        defaultValue: 5,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('hex'),
      })
      .addNumberInput({
        category: ['HexBin'],
        path: 'hex.radiusRangeTo',
        name: 'Radius range to',
        defaultValue: 12,
        showIf: (config: TrackMapOptions) => config.viewTypes.includes('hex'),
      })
  );
};
