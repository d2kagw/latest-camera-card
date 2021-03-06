/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  PropertyValues,
  internalProperty,
} from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  // handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types

import './editor';

import type { CameraConfig, LatestCameraCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  LATEST-CAMERA-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'latest-camera-card',
  name: 'Latest Camera Card',
  description: '📹 Shows the camera feed with the latest movement',
});

@customElement('latest-camera-card')
export class LatestCameraCard extends LitElement {

  constructor() {
    super();

    this.activeCameras = [];
    this.displayTimeout = null;
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('latest-camera-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @internalProperty() private config!: LatestCameraCardConfig;
  @property({ type: Array, attribute: true }) public activeCameras: Array<CameraConfig>;
  @internalProperty() private displayTimeout: any;

  public setConfig(config: LatestCameraCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Latest Camera',
      auto_hide: false,
      ...config,
    };

    console.info("Latest camera card config:", this.config);
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('config')) {
      return true;
    }

    const equals = (a: Array<any>, b: Array<any>): boolean => JSON.stringify(a) === JSON.stringify(b);

    let newActiveCameras: Array<CameraConfig> = [];
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (oldHass) {
      newActiveCameras = this.config.cameras.filter((camera) => {
        return this.hass.states[camera.motion_entity].state === "on"
      });
    }

    const update = !equals(newActiveCameras, this.activeCameras);
    if (update) {
      this.activeCameras = newActiveCameras;
    }

    return update;
  }

  protected render(): TemplateResult | void {
    return html`
      <ha-card
        @action=${this._handleAction}
        tabindex="0"
      >
        ${!this.config.auto_hide && this.activeCameras.length === 0 ? html`
            <div class="live-camera-card live-camera-card-no-movement">
              <span>
                No Movement Detected
              </span>
            </div>
          ` : html``}
        ${this.activeCameras.map((camera) => {
          return html`
            <div class="live-camera-card">
              <hui-image
                .hass=${this.hass}
                .cameraImage=${camera.camera_entity}
                .cameraView=${"live"}
                .entity=${camera.camera_entity}
              ></hui-image>
            </div>
          `;
        })}
      </ha-card>
    `;
  }

  public _handleAction(ev: ActionHandlerEvent): void {
    // TODO: Show the camera feed for the active camera
    console.warn("handle", ev);
    // if (this.hass && this.config && ev.detail.action) {
    //   handleAction(this, this.hass, this.config, ev.detail.action);
    // }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  static get styles(): CSSResult {
    return css`
      .live-camera-card {
        aspect-ratio: 16/9;
      }
      .live-camera-card-no-movement {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
  }
}
