import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import packageJson from '../../../package.json';

import * as styles from './index.module.scss';
import microsoftAgent from './img/agent.png';
import CombineStyles from '../../helpers/CombineStyles.js';
import HyperlinkConfigurator from '../../components/HyperlinkConfigurator/index.js';

// Provider display info
const PROVIDER_INFO = {
	xai: { name: 'xAI (Grok)', icon: 'X', color: '#1DA1F2', apiUrl: 'https://console.x.ai' },
	anthropic: { name: 'Anthropic', icon: 'A', color: '#D4A574', apiUrl: 'https://console.anthropic.com' },
	openai: { name: 'OpenAI', icon: 'O', color: '#10a37f', apiUrl: 'https://platform.openai.com/api-keys' },
	custom: { name: 'Custom/Local', icon: 'C', color: '#6366f1', apiUrl: null }
};

class SettingsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			menu: 'salutation',
			// Settings values
			userName: '',
			voiceEnabled: true,
			useClassicVoice: true,
			speechRate: 1.0,
			// Provider settings
			aiProvider: 'xai',
			providers: {},
			availableProviders: [],
			providerApiKey: '',
			providerModel: '',
			providerBaseUrl: '',
			// UI state
			saveMessage: '',
			saveMessageType: 'success',
			hasChanges: false,
			isSaving: false,
			isTesting: false
		}
		this.setMenu = this.setMenu.bind(this);
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleProviderSelect = this.handleProviderSelect.bind(this);
		this.handleProviderApiKeyChange = this.handleProviderApiKeyChange.bind(this);
		this.handleSaveProviderApiKey = this.handleSaveProviderApiKey.bind(this);
		this.handleProviderModelChange = this.handleProviderModelChange.bind(this);
		this.handleProviderBaseUrlChange = this.handleProviderBaseUrlChange.bind(this);
		this.handleSaveProviderBaseUrl = this.handleSaveProviderBaseUrl.bind(this);
		this.handleTestConnection = this.handleTestConnection.bind(this);
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
			const [voiceEnabled, useClassicVoice, speechRate, userName, availableProviders, aiConfig] = await Promise.all([
				window.electronAPI.getSetting('voiceEnabled'),
				window.electronAPI.getSetting('useClassicVoice'),
				window.electronAPI.getSetting('speechRate'),
				window.electronAPI.getSetting('userName'),
				window.electronAPI.getProviders(),
				window.electronAPI.getAIConfig()
			]);

			this.setState({
				voiceEnabled: voiceEnabled !== false,
				useClassicVoice: useClassicVoice !== false,
				speechRate: speechRate || 1.0,
				userName: userName || '',
				availableProviders: availableProviders || [],
				aiProvider: aiConfig?.aiProvider || 'xai',
				providers: aiConfig?.providers || {}
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

	async handleProviderSelect(providerName) {
		if (typeof window !== 'undefined' && window.electronAPI) {
			await window.electronAPI.setProvider(providerName);
			const aiConfig = await window.electronAPI.getAIConfig();
			this.setState({
				aiProvider: providerName,
				providers: aiConfig?.providers || {},
				providerApiKey: '',
				saveMessage: `Switched to ${PROVIDER_INFO[providerName]?.name || providerName}`,
				saveMessageType: 'success'
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 3000);
		}
	}

	handleProviderApiKeyChange(e) {
		this.setState({ providerApiKey: e.target.value });
	}

	async handleSaveProviderApiKey() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			const { aiProvider, providerApiKey } = this.state;
			this.setState({ isSaving: true });
			await window.electronAPI.setProviderApiKey(aiProvider, providerApiKey);
			const aiConfig = await window.electronAPI.getAIConfig();
			this.setState({
				providerApiKey: '',
				providers: aiConfig?.providers || {},
				saveMessage: 'API key saved successfully!',
				saveMessageType: 'success',
				isSaving: false
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 3000);
		}
	}

	async handleProviderModelChange(e) {
		if (typeof window !== 'undefined' && window.electronAPI) {
			const { aiProvider } = this.state;
			const model = e.target.value;
			await window.electronAPI.setProviderModel(aiProvider, model);
			const aiConfig = await window.electronAPI.getAIConfig();
			this.setState({
				providers: aiConfig?.providers || {},
				saveMessage: 'Model updated!',
				saveMessageType: 'success'
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 2000);
		}
	}

	handleProviderBaseUrlChange(e) {
		this.setState({ providerBaseUrl: e.target.value });
	}

	async handleSaveProviderBaseUrl() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			const { aiProvider, providerBaseUrl } = this.state;
			this.setState({ isSaving: true });
			await window.electronAPI.setProviderBaseUrl(aiProvider, providerBaseUrl);
			const aiConfig = await window.electronAPI.getAIConfig();
			this.setState({
				providerBaseUrl: '',
				providers: aiConfig?.providers || {},
				saveMessage: 'Base URL saved!',
				saveMessageType: 'success',
				isSaving: false
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 3000);
		}
	}

	async handleTestConnection() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			const { aiProvider } = this.state;
			this.setState({ isTesting: true });
			const result = await window.electronAPI.testConnection(aiProvider);
			this.setState({
				isTesting: false,
				saveMessage: result.success ? 'Connection successful!' : `Connection failed: ${result.error}`,
				saveMessageType: result.success ? 'success' : 'error'
			});
			setTimeout(() => this.setState({ saveMessage: '' }), 5000);
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
		const { menu, userName, voiceEnabled, useClassicVoice, speechRate, saveMessage, saveMessageType, hasChanges, isSaving, isTesting, aiProvider, providers, availableProviders, providerApiKey, providerBaseUrl } = this.state;
		const currentProviderInfo = PROVIDER_INFO[aiProvider] || {};
		const currentProviderConfig = providers[aiProvider] || {};
		const currentProviderMeta = availableProviders.find(p => p.id === aiProvider) || {};

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
						{/* Provider Selection */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardIcon}>🤖</div>
								<div className={styles.cardTitle}>
									<h3>AI Provider</h3>
									<p>Choose your preferred AI provider</p>
								</div>
							</div>

							<div className={styles.providerGrid}>
								{Object.entries(PROVIDER_INFO).map(([id, info]) => (
									<div
										key={id}
										className={CombineStyles(
											styles.providerCard,
											aiProvider === id && styles.providerCardActive
										)}
										onClick={() => this.handleProviderSelect(id)}
									>
										<div
											className={styles.providerIcon}
											style={{ backgroundColor: info.color }}
										>
											{info.icon}
										</div>
										<span className={styles.providerName}>{info.name}</span>
									</div>
								))}
							</div>
						</div>

						{/* Provider Configuration */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div
									className={styles.cardIcon}
									style={{ backgroundColor: currentProviderInfo.color }}
								>
									{currentProviderInfo.icon}
								</div>
								<div className={styles.cardTitle}>
									<h3>{currentProviderInfo.name} Configuration</h3>
									<p>Configure your {currentProviderInfo.name} settings</p>
								</div>
							</div>

							{/* API Key */}
							{currentProviderMeta.requiresApiKey !== false && (
								<div className={styles.formGroup}>
									<label>API Key</label>
									{currentProviderInfo.apiUrl && (
										<p style={{ fontSize: '13px', marginBottom: '12px' }}>
											Get your API key from <a href={currentProviderInfo.apiUrl} target="_blank" rel="noopener noreferrer">{currentProviderInfo.apiUrl.replace('https://', '')}</a>
										</p>
									)}
									<div className={styles.inputRow}>
										<input
											type="password"
											className={styles.input}
											placeholder="Enter API key..."
											value={providerApiKey}
											onChange={this.handleProviderApiKeyChange}
										/>
										<button
											className={CombineStyles(styles.btn, styles.btnPrimary)}
											onClick={this.handleSaveProviderApiKey}
											disabled={!providerApiKey || isSaving}
										>
											{isSaving ? 'Saving...' : 'Save Key'}
										</button>
									</div>
									{currentProviderConfig.apiKey && (
										<div className={styles.currentKey}>
											Current: {currentProviderConfig.apiKey}
										</div>
									)}
								</div>
							)}

							{/* Model Selection */}
							<div className={styles.formGroup}>
								<label>Model</label>
								{aiProvider === 'custom' ? (
									<input
										type="text"
										className={styles.input}
										placeholder="Enter model name (e.g., llama2, mistral)"
										value={currentProviderConfig.model || ''}
										onChange={(e) => this.handleProviderModelChange(e)}
									/>
								) : (
									<select
										className={styles.select}
										value={currentProviderConfig.model || ''}
										onChange={this.handleProviderModelChange}
									>
										{(currentProviderMeta.models || []).map(model => (
											<option key={model.id} value={model.id}>
												{model.name}
											</option>
										))}
									</select>
								)}
							</div>

							{/* Base URL (for custom provider) */}
							{aiProvider === 'custom' && (
								<div className={styles.formGroup}>
									<label>Base URL</label>
									<p style={{ fontSize: '13px', marginBottom: '12px' }}>
										The base URL for your OpenAI-compatible endpoint
									</p>
									<div className={styles.inputRow}>
										<input
											type="text"
											className={styles.input}
											placeholder="http://localhost:11434/v1"
											value={providerBaseUrl || currentProviderConfig.baseUrl || ''}
											onChange={this.handleProviderBaseUrlChange}
										/>
										<button
											className={CombineStyles(styles.btn, styles.btnPrimary)}
											onClick={this.handleSaveProviderBaseUrl}
											disabled={!providerBaseUrl || isSaving}
										>
											{isSaving ? 'Saving...' : 'Save URL'}
										</button>
									</div>
									{currentProviderConfig.baseUrl && !providerBaseUrl && (
										<div className={styles.currentKey}>
											Current: {currentProviderConfig.baseUrl}
										</div>
									)}
								</div>
							)}

							{/* Test Connection */}
							<div className={styles.testConnectionRow}>
								<button
									className={CombineStyles(styles.btn, styles.btnSuccess)}
									onClick={this.handleTestConnection}
									disabled={isTesting}
								>
									{isTesting ? 'Testing...' : 'Test Connection'}
								</button>
								{saveMessage && menu === 'ai' && (
									<span className={CombineStyles(styles.inlineStatus, styles[saveMessageType])}>
										{saveMessageType === 'success' ? '✓' : '✕'} {saveMessage}
									</span>
								)}
							</div>
						</div>

						{/* Voice Settings */}
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

						{/* Conversation History */}
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
					</div>
				)}

				{menu === 'copyright' && (
					<div className={styles.content}>
						{/* 2026 Rebuild Credit */}
						<div className={CombineStyles(styles.card, styles.rebuildCredit)}>
							<h3>2026 Rebuild</h3>
							<p>
								Modern rebuild of BonziBuddy by <a href="https://nytemode.com" target="_blank" rel="noopener noreferrer">nytemode</a>
							</p>
							<p>
								<a href="https://github.com/NYTEMODEONLY/BonziBuddy" target="_blank" rel="noopener noreferrer">View on GitHub</a>
							</p>
						</div>

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
