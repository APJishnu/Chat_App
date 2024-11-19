import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { AttachmentFile } from "../interfaces/chat-types";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// Modify the type to MutableRefObject to allow mutations
const MySwal = withReactContent(Swal);

interface ChatServiceProps {
  cameraRef: MutableRefObject<HTMLVideoElement | null>;
  setShowCamera: Dispatch<SetStateAction<boolean>>;
  setSelectedFiles: Dispatch<SetStateAction<AttachmentFile[]>>;
  mediaRecorderRef: MutableRefObject<MediaRecorder | null>;
  audioChunksRef: MutableRefObject<Blob[]>;
  setAudioBlob: Dispatch<SetStateAction<Blob | null>>;
  setAudioUrl: Dispatch<SetStateAction<string | null>>;
  setShowRecordingPreview: Dispatch<SetStateAction<boolean>>;
  setIsRecordingInProgress: Dispatch<SetStateAction<boolean>>;
  setRecordingDuration: Dispatch<SetStateAction<number>>;
  // Change RefObject to MutableRefObject here
  durationTimerRef: MutableRefObject<NodeJS.Timeout | null>;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
}

export class ChatServices {
  private props: ChatServiceProps;

  constructor(props: ChatServiceProps) {
    this.props = props;
  }

  // Camera handling functions
  public startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (this.props.cameraRef.current) {
        this.props.cameraRef.current.srcObject = stream;
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
    }
  };

  public stopCamera = (): void => {
    if (this.props.cameraRef.current && this.props.cameraRef.current.srcObject) {
      const stream = this.props.cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.props.cameraRef.current.srcObject = null;
    }
    this.props.setShowCamera(false);
  };

  public takePicture = (): void => {
    if (this.props.cameraRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = this.props.cameraRef.current.videoWidth;
      canvas.height = this.props.cameraRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(this.props.cameraRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", {
              type: "image/jpeg",
            });
            const preview = canvas.toDataURL("image/jpeg");
            this.props.setSelectedFiles((prev) => [
              ...prev,
              { file, preview, type: "image" },
            ]);
          }
        }, "image/jpeg");
      }
      this.stopCamera();
    }
  };

  public handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ): void => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.props.setSelectedFiles((prev) => [
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

  // Audio recording functions
  public startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.props.mediaRecorderRef.current = new MediaRecorder(stream);

      // Ensure audioChunksRef is initialized
      if (!this.props.audioChunksRef.current) {
        this.props.audioChunksRef.current = [];
      } else {
        this.props.audioChunksRef.current.length = 0; // Clear existing chunks
      }

      this.props.mediaRecorderRef.current.ondataavailable = (event) => {
        if (this.props.audioChunksRef.current) {
          this.props.audioChunksRef.current.push(event.data);
        }
      };

      this.props.mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(this.props.audioChunksRef.current || [], {
          type: "audio/wav",
        });
        this.props.setAudioBlob(audioBlob);
        this.props.setAudioUrl(URL.createObjectURL(audioBlob));
        this.props.setShowRecordingPreview(true);
        this.props.setIsRecordingInProgress(false);

        if (this.props.durationTimerRef.current) {
          clearInterval(this.props.durationTimerRef.current);
        }
      };

      this.props.mediaRecorderRef.current.start();
      this.props.setIsRecordingInProgress(true);
      this.props.setRecordingDuration(0);

      // Make sure durationTimerRef.current is mutable by asserting type
      this.props.durationTimerRef.current = setInterval(() => {
        this.props.setRecordingDuration((prev) => prev + 1);
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
      });
    }
  };

  public pauseRecording = (
    isRecordingInProgress: boolean,
    isPaused: boolean
  ): void => {
    if (this.props.mediaRecorderRef.current && isRecordingInProgress) {
      if (!isPaused) {
        this.props.mediaRecorderRef.current.pause();
        if (this.props.durationTimerRef.current) {
          clearInterval(this.props.durationTimerRef.current);
        }
      } else {
        this.props.mediaRecorderRef.current.resume();
        this.props.durationTimerRef.current = setInterval(() => {
          this.props.setRecordingDuration((prev) => prev + 1);
        }, 1000);
      }
      this.props.setIsPaused(!isPaused);
    }
  };

  public stopRecording = (isRecordingInProgress: boolean): void => {
    if (this.props.mediaRecorderRef.current && isRecordingInProgress) {
      this.props.mediaRecorderRef.current.stop();
      const tracks = this.props.mediaRecorderRef.current.stream.getTracks();
      tracks.forEach((track) => track.stop());

      if (this.props.durationTimerRef.current) {
        clearInterval(this.props.durationTimerRef.current);
      }
    }
  };

  public cancelRecording = (isRecordingInProgress: boolean): void => {
    if (this.props.mediaRecorderRef.current && isRecordingInProgress) {
      this.props.mediaRecorderRef.current.stop();
      const tracks = this.props.mediaRecorderRef.current.stream.getTracks();
      tracks.forEach((track) => track.stop());
    }

    this.props.setIsRecordingInProgress(false);
    this.props.setShowRecordingPreview(false);
    this.props.setAudioBlob(null);
    this.props.setAudioUrl(null);

    if (this.props.durationTimerRef.current) {
      clearInterval(this.props.durationTimerRef.current);
    }
    this.props.setRecordingDuration(0);
  };

  // Utility functions
  public formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
}
