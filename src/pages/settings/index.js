import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import packageJson from '../../../package.json';

import * as styles from './index.module.scss';
import microsoftAgent from './img/agent.png';
import CombineStyles from '../../helpers/CombineStyles.js';
import HyperlinkConfigurator from '../../components/HyperlinkConfigurator/index.js';

class SettingsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			menu: 'salutation',
			// Settings values
			userName: '',
			apiKey: '',
			apiKeyDisplay: '',
			voiceEnabled: true,
			useClassicVoice: true,
			speechRate: 1.0,
			// UI state
			saveMessage: '',
			saveMessageType: 'success',
			hasChanges: false,
			isSaving: false
		}
		this.setMenu = this.setMenu.bind(this);
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleApiKeyChange = this.handleApiKeyChange.bind(this);
		this.handleSaveApiKey = this.handleSaveApiKey.bind(this);
		this.handleVoiceToggle = this.handleVoiceToggle.bind(this);
		this.handleClassicVoiceToggle = this.handleClassicVoiceToggle.bind(this);
		this.handleSpeechRateChange = this.handleSpeechRateChange.bind(this);
		this.handleClearHistory = this.handleClearHistory.bind(this);
		this.handleSave = this.handleSave.bind(this);
		this.handleCancel = this.handleCancel.bind(this);
	}

	async componentDidMount() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			// Load current settings
			const [apiKeyDisplay, voiceEnabled, useClassicVoice, speechRate, userName] = await Promise.all([
				window.electronAPI.getApiKey(),
				window.electronAPI.getSetting('voiceEnabled'),
				window.electronAPI.getSetting('useClassicVoice'),
				window.electronAPI.getSetting('speechRate'),
				window.electronAPI.getSetting('userName')
			]);

			this.setState({
				apiKeyDisplay: apiKeyDisplay || '',
				voiceEnabled: voiceEnabled !== false,
				useClassicVoice: useClassicVoice !== false,
				speechRate: speechRate || 1.0,
				userName: userName || ''
			});
		}
	}

	setMenu(menu) {
		return () => this.setState({
			menu,
			saveMessage: ''
		})
	}

	handleNameChange(e) {
		this.setState({ userName: e.target.value, hasChanges: true });
	}

	handleApiKeyChange(e) {
		this.setState({ apiKey: e.target.value });
	}

	async handleSaveApiKey() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			this.setState({ isSaving: true });
			await window.electronAPI.setApiKey(this.state.apiKey);
			const apiKeyDisplay = await window.electronAPI.getApiKey();
			this.setState({
				apiKey: '',
				apiKeyDisplay,
				saveMessage: 'API key saved successfully!',
				saveMessageType: 'success',
				isSaving: false
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 3000);
		}
	}

	async handleVoiceToggle() {
		const newValue = !this.state.voiceEnabled;
		this.setState({ voiceEnabled: newValue, hasChanges: true });
		if (typeof window !== 'undefined' && window.electronAPI) {
			await window.electronAPI.setSetting('voiceEnabled', newValue);
		}
	}

	async handleClassicVoiceToggle() {
		const newValue = !this.state.useClassicVoice;
		this.setState({ useClassicVoice: newValue, hasChanges: true });
		if (typeof window !== 'undefined' && window.electronAPI) {
			await window.electronAPI.setSetting('useClassicVoice', newValue);
		}
	}

	async handleSpeechRateChange(e) {
		const newRate = parseFloat(e.target.value);
		this.setState({ speechRate: newRate, hasChanges: true });
		if (typeof window !== 'undefined' && window.electronAPI) {
			await window.electronAPI.setSetting('speechRate', newRate);
		}
	}

	async handleClearHistory() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			await window.electronAPI.clearHistory();
			this.setState({
				saveMessage: 'Conversation history cleared!',
				saveMessageType: 'success'
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 3000);
		}
	}

	async handleSave() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			this.setState({ isSaving: true });
			await window.electronAPI.setSetting('userName', this.state.userName);
			this.setState({
				hasChanges: false,
				isSaving: false,
				saveMessage: 'Settings saved successfully!',
				saveMessageType: 'success'
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 3000);
		}
	}

	handleCancel() {
		if (typeof window !== 'undefined' && window.close) {
			window.close();
		}
	}

	render() {
		const { menu, userName, apiKey, apiKeyDisplay, voiceEnabled, useClassicVoice, speechRate, saveMessage, saveMessageType, hasChanges, isSaving } = this.state;

		return (
			<div className={styles.grid}>
				<Helmet>
					<title>Bonzi's Options and Settings - {packageJson.version}</title>
				</Helmet>

				{/* Header */}
				<div className={styles.header}>
					<h1>Settings</h1>
					<span className={styles.version}>v{packageJson.version}</span>
				</div>

				{/* Navigation */}
				<div className={styles.navigation}>
					<p className={CombineStyles(styles.navigationButton, menu === 'salutation' && styles.navigationSelected)} onClick={this.setMenu('salutation')}>
						Salutation
					</p>
					<p className={CombineStyles(styles.navigationButton, menu === 'hyperlinks' && styles.navigationSelected)} onClick={this.setMenu('hyperlinks')}>
						Hyperlinks
					</p>
					<p className={CombineStyles(styles.navigationButton, menu === 'ai' && styles.navigationSelected)} onClick={this.setMenu('ai')}>
						AI Assistant
					</p>
					<p className={CombineStyles(styles.navigationButton, menu === 'copyright' && styles.navigationSelected)} onClick={this.setMenu('copyright')}>
						Copyright
					</p>
				</div>

				{/* Content */}
				{menu === 'salutation' && (
					<div className={styles.content}>
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardIcon}>👋</div>
								<div className={styles.cardTitle}>
									<h3>Your Name</h3>
									<p>How would you like BonziBuddy to address you?</p>
								</div>
							</div>
							<div className={styles.formGroup}>
								<label>Enter your name or nickname</label>
								<input
									type="text"
									className={styles.input}
									value={userName}
									onChange={this.handleNameChange}
									placeholder="e.g., John, Captain, Friend..."
								/>
							</div>
						</div>
					</div>
				)}

				{menu === 'hyperlinks' && (
					<div className={styles.content}>
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardIcon}>🔗</div>
								<div className={styles.cardTitle}>
									<h3>Quick Links</h3>
									<p>Configure your favorite websites for quick access</p>
								</div>
							</div>
							<HyperlinkConfigurator />
						</div>
					</div>
				)}

				{menu === 'ai' && (
					<div className={styles.content}>
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardIcon}>🤖</div>
								<div className={styles.cardTitle}>
									<h3>xAI API Configuration</h3>
									<p>Connect BonziBuddy to Grok for AI-powered conversations</p>
								</div>
							</div>

							<div className={styles.formGroup}>
								<label>xAI API Key</label>
								<p style={{ fontSize: '13px', marginBottom: '12px' }}>
									Get your API key from <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer">console.x.ai</a>
								</p>
								<div className={styles.inputRow}>
									<input
										type="password"
										className={styles.input}
										placeholder="xai-..."
										value={apiKey}
										onChange={this.handleApiKeyChange}
									/>
									<button
										className={CombineStyles(styles.btn, styles.btnPrimary)}
										onClick={this.handleSaveApiKey}
										disabled={!apiKey || isSaving}
									>
										{isSaving ? 'Saving...' : 'Save Key'}
									</button>
								</div>
								{apiKeyDisplay && (
									<div className={styles.currentKey}>
										Current: {apiKeyDisplay}
									</div>
								)}
							</div>
						</div>

						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardIcon}>🔊</div>
								<div className={styles.cardTitle}>
									<h3>Voice Settings</h3>
									<p>Configure text-to-speech options</p>
								</div>
							</div>

							<div
								className={CombineStyles(styles.toggle, voiceEnabled && styles.toggleActive)}
								onClick={this.handleVoiceToggle}
							>
								<div className={styles.toggleSwitch}></div>
								<span className={styles.toggleLabel}>Enable voice output</span>
							</div>

							<div
								className={CombineStyles(styles.toggle, useClassicVoice && styles.toggleActive)}
								onClick={this.handleClassicVoiceToggle}
								style={{ marginTop: '12px' }}
							>
								<div className={styles.toggleSwitch}></div>
								<span className={styles.toggleLabel}>Use classic BonziBuddy voice (SAPI4)</span>
							</div>
							<p style={{ fontSize: '12px', color: 'rgba(196, 181, 253, 0.7)', marginTop: '8px', marginBottom: '16px' }}>
								The original voice from the 90s! Powered by tetyys.com
							</p>

							<div className={styles.sliderGroup}>
								<div className={styles.sliderLabel}>
									<span>Speech Rate</span>
									<span className={styles.sliderValue}>{speechRate.toFixed(1)}x</span>
								</div>
								<input
									type="range"
									className={styles.slider}
									min="0.5"
									max="2.0"
									step="0.1"
									value={speechRate}
									onChange={this.handleSpeechRateChange}
								/>
							</div>
						</div>

						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardIcon}>💬</div>
								<div className={styles.cardTitle}>
									<h3>Conversation History</h3>
									<p>Manage your chat history with BonziBuddy</p>
								</div>
							</div>

							<button
								className={CombineStyles(styles.btn, styles.btnDanger)}
								onClick={this.handleClearHistory}
							>
								Clear Conversation History
							</button>
						</div>

						{saveMessage && (
							<div className={CombineStyles(styles.statusMessage, styles[saveMessageType])}>
								{saveMessageType === 'success' ? '✓' : '✕'} {saveMessage}
							</div>
						)}
					</div>
				)}

				{menu === 'copyright' && (
					<div className={styles.content}>
						<div className={CombineStyles(styles.card, styles.copyrightSection)}>
							<h3>BonziBuddy</h3>
							<p>Copyright (c) 1995-2000 BONZI.COM Software</p>
							<p>
								BonziBUDDY and BONZI are trademarks of BONZI.COM Software.
								All rights and liabilities with respect to BonziBUDDY belong solely to BONZI.COM Software.
								BonziBUDDY uses Microsoft Agent Technology.
							</p>

							<h3>pi0/Clippy.JS</h3>
							<p>
								Copyright (c) 2012 Fireplace, Inc<br />
								Copyright (c) 2017 Pooya Parsa
							</p>
							<p>
								Permission is hereby granted, free of charge, to any person obtaining a copy of this software
								and associated documentation files (the "Software"), to deal in the Software without restriction,
								including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
								and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
								subject to the following conditions:
							</p>
							<p>
								The above copyright notice and this permission notice shall be included in all copies or substantial
								portions of the Software.
							</p>
							<p>
								THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
								LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
							</p>

							<h3>Electron</h3>
							<p>Copyright (c) 2013-2019 GitHub Inc.</p>
							<p>
								Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
								associated documentation files (the "Software"), to deal in the Software without restriction,
								including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
								and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
								subject to the following conditions:
							</p>
							<p>
								The above copyright notice and this permission notice shall be included in all copies or substantial
								portions of the Software.
							</p>

							<h3>Microsoft Agent</h3>
							<img alt="The Microsoft Agent Logo" src={microsoftAgent} className={styles.microsoftAgent} />
							<p>Copyright (c) 1996-1998 Microsoft Corp.</p>
							<p>
								Warning: This computer program is protected by copyright law and international treaties.
								Unauthorized reproduction or distribution of this program, or any portion of it, may result
								in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under the law.
							</p>
						</div>
					</div>
				)}

				{/* Footer with OK/Cancel buttons */}
				<div className={styles.footer}>
					{saveMessage && menu !== 'ai' && (
						<div className={CombineStyles(styles.statusMessage, styles[saveMessageType])} style={{ marginRight: 'auto', marginTop: 0 }}>
							{saveMessageType === 'success' ? '✓' : '✕'} {saveMessage}
						</div>
					)}
					<button
						className={CombineStyles(styles.btn, styles.btnSecondary)}
						onClick={this.handleCancel}
					>
						Cancel
					</button>
					<button
						className={CombineStyles(styles.btn, styles.btnPrimary)}
						onClick={this.handleSave}
						disabled={isSaving}
					>
						{isSaving ? 'Saving...' : 'OK'}
					</button>
				</div>
			</div>
		);
	}
}

export default SettingsPage;
