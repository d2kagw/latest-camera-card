/* eslint-disable @typescript-eslint/no-explicit-any */
import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'latest-camera-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

export interface CameraConfig {
  camera_entity: any;
  motion_entity: any;
}

export interface LatestCameraCardConfig extends LovelaceCardConfig {
  type: string;
  cameras: Array<CameraConfig>;
  interval?: number;
}
