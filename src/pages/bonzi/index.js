import React, { Component } from "react"
import { Helmet } from "react-helmet"
import "./styles.scss"

// Available animations for different contexts
const IDLE_ANIMATIONS = [
  'Idle1_1', 'Idle1_2', 'Idle1_3', 'Idle1_4', 'Idle1_5', 'Idle1_6',
  'Idle2_1', 'Blink', 'LookLeft', 'LookRight', 'LookUp', 'LookDown'
]

const GREETING_ANIMATIONS = ['Wave', 'Greet', 'GetAttention']
const THINKING_ANIMATIONS = ['Think', 'Searching', 'LookUp']
const SUCCESS_ANIMATIONS = ['Pleased', 'Congratulate', 'Wave']
const ERROR_ANIMATIONS = ['Confused', 'Sad', 'Uncertain']
const ATTENTION_ANIMATIONS = ['GetAttention', 'GetAttention2', 'Wave']
const SINGING_ANIMATIONS = ['Pleased', 'Congratulate', 'Wave', 'GetAttention']
const JOKE_ANIMATIONS = ['Pleased', 'Congratulate', 'GetAttention']
const FACT_ANIMATIONS = ['Think', 'Searching', 'Pleased']
const STORY_ANIMATIONS = ['GetAttention', 'Wave', 'Pleased']

class BonziBuddy extends Component {
  constructor(props) {
    super(props)
    this.onRightClick = this.onRightClick.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.moveWindow = this.moveWindow.bind(this)
    this.handleChatSubmit = this.handleChatSubmit.bind(this)
    this.handleChatKeyDown = this.handleChatKeyDown.bind(this)
    this.closeChatInput = this.closeChatInput.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.playRandomIdle = this.playRandomIdle.bind(this)
    this.handleEntertainment = this.handleEntertainment.bind(this)
    this.agent = null
    this.animationId = null
    this.idleTimerId = null
    this.mouseX = null
    this.mouseY = null
    this.isDragging = false
    this.chatExpand = { extraWidth: 160, extraHeight: 70 }
    this.state = {
      showChatInput: false,
      chatMessage: '',
      isThinking: false
    }
  }

  // Play a random animation from a given array
  playRandomAnimation(animations, callback) {
    if (!this.agent) return
    const animation = animations[Math.floor(Math.random() * animations.length)]
    this.agent.play(animation, 5000, callback)
  }

  // Play random idle animation periodically
  playRandomIdle() {
    if (!this.agent || this.state.isThinking || this.state.showChatInput) return
    this.playRandomAnimation(IDLE_ANIMATIONS)
  }

  // Start the idle animation timer
  startIdleTimer() {
    // Clear any existing timer
    if (this.idleTimerId) {
      clearInterval(this.idleTimerId)
    }
    // Play idle animation every 15-30 seconds
    const interval = 15000 + Math.random() * 15000
    this.idleTimerId = setInterval(() => {
      this.playRandomIdle()
    }, interval)
  }

  // Stop the idle animation timer
  stopIdleTimer() {
    if (this.idleTimerId) {
      clearInterval(this.idleTimerId)
      this.idleTimerId = null
    }
  }

  onMouseDown(e) {
    // Only drag on left mouse button (button 0), not right-click (button 2)
    if (e.button !== 0) return

    if (typeof window !== 'undefined' && window.electronAPI) {
      this.isDragging = true
      this.mouseX = e.clientX
      this.mouseY = e.clientY
      this.animationId = requestAnimationFrame(this.moveWindow)
      e.preventDefault()
    }
  }

  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.windowMoved()
      }
    }
  }

  moveWindow() {
    if (this.isDragging && typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.windowMoving({
        mouseX: this.mouseX,
        mouseY: this.mouseY,
      })
      this.animationId = requestAnimationFrame(this.moveWindow)
    }
  }

  onRightClick(e) {
    e.preventDefault()
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.showContextMenu()
    }
  }

  speak(text, animation = null) {
    if (!this.agent) return

    // Play animation if specified
    if (animation) {
      if (Array.isArray(animation)) {
        this.playRandomAnimation(animation)
      } else {
        this.agent.play(animation)
      }
    }

    // Show speech bubble via clippy
    this.agent.speak(text)

    // Use voice output
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getSetting('voiceEnabled').then(voiceEnabled => {
        if (voiceEnabled !== false) {
          window.electronAPI.getSetting('useClassicVoice').then(useClassicVoice => {
            if (useClassicVoice !== false) {
              // Use classic SAPI4 BonziBuddy voice via TETYYS API
              this.playClassicVoice(text)
            } else if ('speechSynthesis' in window) {
              // Use modern Web Speech API
              window.electronAPI.getSetting('speechRate').then(rate => {
                const utterance = new SpeechSynthesisUtterance(text)
                utterance.rate = rate || 1.0
                // Try to find a suitable voice
                const voices = window.speechSynthesis.getVoices()
                const preferredVoice = voices.find(v =>
                  v.name.includes('Alex') ||
                  v.name.includes('Daniel') ||
                  v.name.includes('Fred')
                )
                if (preferredVoice) {
                  utterance.voice = preferredVoice
                }
                window.speechSynthesis.speak(utterance)
              }).catch(err => console.error('Failed to get speechRate:', err))
            }
          }).catch(err => console.error('Failed to get useClassicVoice:', err))
        }
      }).catch(err => console.error('Failed to get voiceEnabled:', err))
    }
  }

  // Play audio using the classic SAPI4 BonziBuddy voice
  async playClassicVoice(text) {
    try {
      // TETYYS SAPI4 API - Adult Male #2 with BonziBuddy settings
      const voice = encodeURIComponent('Adult Male #2, American English (TruVoice)')
      const encodedText = encodeURIComponent(text)
      const pitch = 140
      const speed = 157
      const url = `https://tetyys.com/SAPI4/SAPI4?text=${encodedText}&voice=${voice}&pitch=${pitch}&speed=${speed}`

      const audio = new Audio(url)
      audio.play().catch(err => {
        console.error('Failed to play classic voice:', err)
        // Fallback to Web Speech API if classic voice fails
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          window.speechSynthesis.speak(utterance)
        }
      })
    } catch (error) {
      console.error('Classic voice error:', error)
    }
  }

  async handleChatSubmit(e) {
    e.preventDefault()
    const message = this.state.chatMessage.trim()
    if (!message || this.state.isThinking) return

    this.setState({ isThinking: true, chatMessage: '' })

    // Play thinking animation
    if (this.agent) {
      this.playRandomAnimation(THINKING_ANIMATIONS)
    }

    try {
      if (!window.electronAPI) {
        this.speak("I can only chat in the Electron app!", ERROR_ANIMATIONS)
        return
      }
      const result = await window.electronAPI.sendMessage(message)

      if (result.error) {
        // Play error/confused animation
        this.speak(result.error, ERROR_ANIMATIONS)
      } else if (result.response) {
        // Play success/pleased animation
        this.speak(result.response, SUCCESS_ANIMATIONS)
      }
    } catch (error) {
      console.error('Chat error:', error)
      this.speak("Oops! Something went wrong. Try again later!", ERROR_ANIMATIONS)
    }

    this.setState({ isThinking: false })
    this.closeChatInput()
  }

  handleChatKeyDown(e) {
    if (e.key === 'Escape') {
      this.closeChatInput()
    }
  }

  closeChatInput() {
    if (!this.state.showChatInput) return
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.shrinkWindowFromChat(this.chatExpand)
    }
    // Remove click outside listener
    document.removeEventListener('mousedown', this.handleClickOutside)
    this.setState({ showChatInput: false, chatMessage: '' })
    // Restart idle timer
    this.startIdleTimer()
  }

  handleClickOutside(e) {
    // If clicking outside the chat input container, close it
    const chatContainer = document.querySelector('.chat-input-container')
    if (chatContainer && !chatContainer.contains(e.target)) {
      // Only close if no message has been typed
      if (!this.state.chatMessage.trim() && !this.state.isThinking) {
        this.closeChatInput()
      }
    }
  }

  async handleEntertainment(data) {
    if (!window.electronAPI || this.state.isThinking) return

    const { type } = data
    this.setState({ isThinking: true })

    // Stop idle animations during entertainment
    this.stopIdleTimer()

    // Play thinking animation while fetching content
    if (this.agent) {
      this.playRandomAnimation(THINKING_ANIMATIONS)
    }

    try {
      const result = await window.electronAPI.getEntertainment(type)

      if (result.error) {
        this.speak(result.error, ERROR_ANIMATIONS)
      } else if (result.response) {
        // Choose appropriate animation based on type
        let animations
        switch (type) {
          case 'sing':
            animations = SINGING_ANIMATIONS
            break
          case 'joke':
            animations = JOKE_ANIMATIONS
            break
          case 'fact':
            animations = FACT_ANIMATIONS
            break
          case 'story':
            animations = STORY_ANIMATIONS
            break
          default:
            animations = SUCCESS_ANIMATIONS
        }
        this.speak(result.response, animations)
      }
    } catch (error) {
      console.error('Entertainment error:', error)
      this.speak("Oops! Something went wrong. Try again later!", ERROR_ANIMATIONS)
    }

    this.setState({ isThinking: false })
    // Restart idle timer after a delay
    setTimeout(() => {
      this.startIdleTimer()
    }, 5000)
  }

  componentDidMount() {
    // Add global mouseup listener to handle drag release outside window
    if (typeof window !== 'undefined') {
      window.addEventListener('mouseup', this.onMouseUp)
    }

    if (typeof window !== 'undefined' && window.electronAPI) {
      // Listen for close program command
      window.electronAPI.onCloseProgram(() => {
        this.stopIdleTimer()
        if (this.agent) {
          this.agent.play("Sad", 2000, () => {
            this.agent.play("Hide", undefined, () => {
              window.electronAPI.closeProgram(0)
            })
          })
        } else {
          window.electronAPI.closeProgram(0)
        }
      })

      // Listen for entertainment commands
      window.electronAPI.onEntertainment((data) => {
        this.handleEntertainment(data)
      })

      // Listen for chat input open command
      window.electronAPI.onOpenChatInput(() => {
        // Stop idle animations while chatting
        this.stopIdleTimer()
        // Play attention animation
        if (this.agent) {
          this.playRandomAnimation(ATTENTION_ANIMATIONS)
        }
        // Expand window to make room for chat input
        window.electronAPI.expandWindowForChat(this.chatExpand)
        this.setState({ showChatInput: true }, () => {
          const input = document.getElementById('chat-input')
          if (input) input.focus()
          // Add click outside listener after a brief delay to avoid immediate trigger
          setTimeout(() => {
            document.addEventListener('mousedown', this.handleClickOutside)
          }, 100)
        })
      })
    }

    // Load clippy/Bonzi only on client side
    if (typeof window !== 'undefined') {
      import('clippyjs').then(({ default: clippy }) => {
        clippy.load(
          'Bonzi',
          agent => {
            this.agent = agent
            agent.show()
            console.log('Bonzi agent loaded:', agent)

            if (typeof window !== 'undefined' && window.electronAPI) {
              window.electronAPI.resizeWindow(agent._animator._data.framesize)

              // Greeting on startup with wave animation
              setTimeout(() => {
                this.playRandomAnimation(GREETING_ANIMATIONS, () => {
                  this.speak("Hi there! I'm BonziBuddy! Right-click me to chat!")
                })
              }, 500)

              // Start idle animation timer after greeting
              setTimeout(() => {
                this.startIdleTimer()
              }, 5000)
            }
          },
          err => {
            console.error('Failed to load Bonzi agent:', err)
          },
          "/clippy.js/agents/"
        )
      }).catch(err => {
        console.error('Failed to import clippyjs:', err)
      })
    }
  }

  componentWillUnmount() {
    // Clean up global listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('mouseup', this.onMouseUp)
      document.removeEventListener('mousedown', this.handleClickOutside)
    }
    // Cancel any pending animation frame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    // Stop idle timer
    this.stopIdleTimer()
  }

  render() {
    const { showChatInput, chatMessage, isThinking } = this.state

    return (
      <div
        className="div"
        id="div"
        onContextMenu={this.onRightClick}
        onMouseDown={this.onMouseDown}
      >
        <Helmet>
          <title>BonziBuddy</title>
        </Helmet>

        {showChatInput && (
          <div className="chat-input-container">
            <form onSubmit={this.handleChatSubmit}>
              <input
                id="chat-input"
                type="text"
                value={chatMessage}
                onChange={(e) => this.setState({ chatMessage: e.target.value })}
                onKeyDown={this.handleChatKeyDown}
                placeholder={isThinking ? "Thinking..." : "Say something..."}
                disabled={isThinking}
                autoFocus
              />
              <button type="submit" disabled={isThinking || !chatMessage.trim()}>
                {isThinking ? '...' : 'Send'}
              </button>
              <button type="button" onClick={this.closeChatInput} className="close-btn">
                X
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }
}

export default BonziBuddy
