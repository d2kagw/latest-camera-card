/* eslint-disable @typescript-eslint/no-explicit-any */
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

    this.lastRefresh = null;
    this.refreshTimeout = null;
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('latest-camera-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @internalProperty() private config!: LatestCameraCardConfig;
  @internalProperty() private lastRefresh: Date|null;
  @internalProperty() private refreshTimeout: any;

  public setConfig(config: LatestCameraCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'LatestCamera',
      ...config,
    };

    console.info("Latest camera card config:", this.config);

    this._refresh();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected _refresh(): void {
    const seconds = (this.config.interval||60);
    setTimeout(() => { this.lastRefresh = new Date() }, seconds * 1000);

    console.info("Latest camera card", "refreshing feed in ", seconds, "seconds");
  }

  protected render(): TemplateResult | void {
    console.info("Latest camera card", "updating");
    const cameraSort = (a: CameraConfig, b: CameraConfig): number => {
      return Date.parse(this.hass.states[b.motion_entity].attributes.last_tripped_time) -
        Date.parse(this.hass.states[a.motion_entity].attributes.last_tripped_time);
    }

    const activeCamera = this.config.cameras.slice().sort(cameraSort)[0];

    return html`
      <ha-card
        @action=${this._handleAction}
        tabindex="0"
      >
        <div class="live-camera-card">
          <hui-image
            .hass=${this.hass}
            .cameraImage=${activeCamera.camera_entity}
            .cameraView=${"live"}
            .entity=${activeCamera.camera_entity}
          ></hui-image>
        </div>
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
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
    return css``;
  }
}
