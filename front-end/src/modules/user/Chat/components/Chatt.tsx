  // Chat.tsx
  "use client";

  import React, { useState, useEffect, useRef } from "react";
  import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
  import apolloClient from "@/lib/apollo-client";
  import EmojiPicker from "emoji-picker-react";
  import styles from "./Chat.module.css";
  import { useCurrentUserId } from "@/context/useContext";
  import { ChatProps, Message, AttachmentFile } from "../interfaces/chat-types";
  import {
    PhoneOutlined,
    VideoCameraOutlined,
    SearchOutlined,
    PaperClipOutlined,
    SendOutlined,
    AudioOutlined,
    CameraOutlined,
    PictureOutlined,
    FileOutlined,
    EnvironmentOutlined,
    CloseOutlined,
    PauseCircleOutlined,
    DeleteOutlined,
  } from "@ant-design/icons";
  import Swal from "sweetalert2";
  import withReactContent from "sweetalert2-react-content";

  const MySwal = withReactContent(Swal);

  // GraphQL queries remain the same
  const GET_MESSAGES = gql`
    query GetMessages($recipientId: Int!) {
      getMessages(recipientId: $recipientId) {
        id
        text
        imageUrl
        audioUrl
        timestamp
        senderId
      }
    }
  `;

  const SEND_MESSAGE = gql`
    mutation SendMessage($text: String!, $image: Upload, $audio:Upload, $recipientId: Int!) {
      sendMessage(text: $text, image: $image, audio: $audio, recipientId: $recipientId) {
        id
        text
        imageUrl
        audioUrl
        timestamp
        senderId
      }
    }
  `;

  const MESSAGE_SUBSCRIPTION = gql`
    subscription MessageSent($recipientId: Int!) {
      messageSent(recipientId: $recipientId) {
        id
        text
        imageUrl
        audioUrl
        timestamp
        senderId
      }
    }
  `;

  const Chat: React.FC<ChatProps> = ({
    recipientId,
    recipientUserName,
    recipientProfileImage,
  }) => {
    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<AttachmentFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showRecordingPreview, setShowRecordingPreview] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioPlayerRef = useRef<HTMLAudioElement>(null);
    const multipleFileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLVideoElement>(null);
    const currentUserIdString = useCurrentUserId();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = Number(currentUserIdString);

  const {
    data: queryData,
    loading,
    error,
  } = useQuery(GET_MESSAGES, {
    client: apolloClient,
    variables: { recipientId: Number(recipientId) },
    fetchPolicy: "network-only",
    skip: !recipientId,
  });

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    client: apolloClient,
    onCompleted: () => {
      setMessage("");
      setSelectedFiles([]);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to send message. Please try again.",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      console.error("Error accessing microphone:", error);

      setIsUploading(false);
    },
  });

  useSubscription(MESSAGE_SUBSCRIPTION, {
    client: apolloClient,
    variables: { recipientId: Number(recipientId) },
    onData: ({ data }) => {
      const newMessage = data.data?.messageSent;
      if (newMessage) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === newMessage.id);
          if (!messageExists) {
            return [
              ...prev,
              {
                ...newMessage,
                timestamp: new Date(newMessage.timestamp),
              },
            ];
          }
          return prev;
        });
      }
    },
  });


  useEffect(() => {
    if (queryData?.getMessages) {
      const formattedMessages = queryData.getMessages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);
    }
  }, [queryData, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Camera handling
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Unable to access camera. Please check permissions.",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      console.error("Error accessing microphone:", err);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      cameraRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const takePicture = () => {
    if (cameraRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = cameraRef.current.videoWidth;
      canvas.height = cameraRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(cameraRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", {
              type: "image/jpeg",
            });
            const preview = canvas.toDataURL("image/jpeg");
            setSelectedFiles((prev) => [
              ...prev,
              { file, preview, type: "image" },
            ]);
          }
        }, "image/jpeg");
      }
      stopCamera();
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFiles((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    console.log("hai")
    console.log(audioBlob)
    if (message.trim() === "" && selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const firstFile = selectedFiles[0]?.file;
      const audioToSend = audioBlob || null;
      await sendMessage({
        variables: {
          text: message,
          image: firstFile,
          audio: audioToSend,
          recipientId: Number(recipientId),
        },
      });

      console.log(audioUrl)

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      console.error("Error sending message:", error);
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  // Function to format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording with preview
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setShowRecordingPreview(true);
        setIsRecordingInProgress(false);
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecordingInProgress(true);
      setRecordingDuration(0);

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      MySwal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Unable to access microphone. Please check permissions.",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          popup: styles.popup,
          icon: styles.icon,
          title: styles.title,
          timerProgressBar: styles.progressBar,
        },
      });
      console.error("Error accessing microphone:", error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecordingInProgress) {
      if (!isPaused) {
        mediaRecorderRef.current.pause();
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
        }
      } else {
        mediaRecorderRef.current.resume();
        durationTimerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingInProgress) {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach((track) => track.stop());
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecordingInProgress) {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsRecordingInProgress(false);
    setShowRecordingPreview(false);
    setAudioBlob(null);
    setAudioUrl(null);
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    setRecordingDuration(0);
  };

  // ..

  if (loading)
    return <div className={styles.loadingContainer}>Loading chat...</div>;
  if (error)
    return <div className={styles.errorContainer}>Error: {error.message}</div>;

  return (
    <div className={styles.chatContainer}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.recipientInfo}>
          {recipientProfileImage ? (
            <img
              src={recipientProfileImage}
              alt={recipientUserName}
              className={styles.recipientImage}
            />
          ) : (
            <div className={styles.recipientAvatar}>
              <span className={styles.avatarFallback}>
                {recipientUserName[0]}
              </span>
            </div>
          )}
          <h2>{recipientUserName}</h2>
        </div>
        <div className={styles.chatHeaderActions}>
          <button
            onClick={() => alert("Feature not implemented!")}
            title="Make a Call"
            className={styles.actionButton}
          >
            <PhoneOutlined />
          </button>
          <button
            onClick={() => alert("Feature not implemented!")}
            title="Make a Video Call"
            className={styles.actionButton}
          >
            <VideoCameraOutlined />
          </button>
          <button
            onClick={() => alert("Search functionality coming soon!")}
            title="Search"
            className={styles.actionButton}
          >
            <SearchOutlined />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.senderId === currentUserId
                ? styles.messageSent
                : styles.messageReceived
            }`}
          >
            <div className={styles.messageBubble}>
              {msg.text && <p>{msg.text}</p>}
              {msg.imageUrl && (
                <div className={styles.messageImageContainer}>
                  <img
                    src={msg.imageUrl}
                    alt="Message attachment"
                    className={`${styles.messageImage} ${
                      isUploading ? styles.messageImageLoading : ""
                    }`}
                  />
                </div>
              )}
               {msg.audioUrl && (
                <div className={styles.audioMessage}>
                  <audio controls src={msg.audioUrl}></audio>
                </div>
              )}
              <span className={styles.messageTimestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className={styles.filePreviewContainer}>
          {selectedFiles.map((file, index) => (
            <div key={index} className={styles.filePreview}>
              <button
                onClick={() => removeSelectedFile(index)}
                className={styles.filePreviewClose}
              >
                <CloseOutlined />
              </button>
              {file.type === "image" ? (
                <img src={file.preview} alt="Preview" />
              ) : (
                <video src={file.preview} controls />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className={styles.cameraContainer}>
          <video ref={cameraRef} autoPlay className={styles.cameraView} />
          <div className={styles.cameraControls}>
            <button onClick={takePicture} className={styles.captureButton}>
              Take Photo
            </button>
            <button onClick={stopCamera} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className={styles.messageInput}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={styles.emojiButton}
        >
          😀
        </button>

        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, "image")}
          className={styles.fileInput}
          ref={multipleFileInputRef}
          multiple
        />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => handleFileSelect(e, "video")}
          className={styles.fileInput}
          ref={videoInputRef}
        />

        {/* Attachment Menu */}
        <div className={styles.attachmentWrapper}>
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className={styles.attachButton}
          >
            <PaperClipOutlined />
          </button>

          {showAttachmentMenu && (
            <div className={styles.attachmentMenu}>
              <button
                onClick={() => {
                  setShowCamera(true);
                  setShowAttachmentMenu(false);
                  startCamera();
                }}
                className={styles.attachmentOption}
              >
                <CameraOutlined /> Camera
              </button>
              <button
                onClick={() => {
                  multipleFileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className={styles.attachmentOption}
              >
                <PictureOutlined /> Photos & Videos
              </button>
              <button
                onClick={() => alert("Document upload coming soon!")}
                className={styles.attachmentOption}
              >
                <FileOutlined /> Document
              </button>
              <button
                onClick={() => alert("Location sharing coming soon!")}
                className={styles.attachmentOption}
              >
                <EnvironmentOutlined /> Location
              </button>
            </div>
          )}
        </div>

        {isRecordingInProgress ? (
          <div className={styles.recordingContainer}>
            <div className={styles.recordingWave}>
              <div className={styles.recordingDot} />
              Recording... {formatDuration(recordingDuration)}
            </div>
            <button
              onClick={pauseRecording}
              className={styles.recordingControl}
            >
              <PauseCircleOutlined />
            </button>
            <button
              onClick={cancelRecording}
              className={styles.recordingControl}
            >
              <CloseOutlined />
            </button>
          </div>
        ) : showRecordingPreview ? (
          <div className={styles.recordingPreview}>
            <audio ref={audioPlayerRef} src={audioUrl || ""} controls />
            <button
              onClick={cancelRecording}
              className={styles.recordingControl}
            >
              <DeleteOutlined />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className={styles.messageInputField}
          />
        )}

        {message.trim() || selectedFiles.length > 0 || showRecordingPreview ? (
          <button onClick={handleSendMessage} className={styles.sendButton}>
            <SendOutlined />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className={`${styles.recordButton} ${
              isRecordingInProgress ? styles.recording : ""
            }`}
          >
            <AudioOutlined />
          </button>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className={styles.uploadProgress}>
          <div
            className={styles.uploadProgressBar}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className={styles.emojiPickerContainer}>
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setMessage((prev) => prev + emojiData.emoji);
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
