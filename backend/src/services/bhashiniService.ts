/**
 * Bhashini ASR Service for Indian Languages (Kannada)
 * Documentation: https://bhashini.gitbook.io/bhashini-apis
 */
import axios from 'axios';
import fs from 'fs';

const BHASHINI_BASE_URL = 'https://meity-auth.ulcacontrib.org';
const BHASHINI_PIPELINE_ENDPOINT = '/ulca/apis/v0/model/getModelsPipeline';

// Language code mapping
const LANGUAGE_CODES: { [key: string]: string } = {
  'kn': 'kn', // Kannada
  'hi': 'hi', // Hindi
  'ta': 'ta', // Tamil
  'te': 'te', // Telugu
  'ml': 'ml', // Malayalam
  'en': 'en'  // English
};

interface BhashiniConfig {
  userId: string;
  ulcaApiKey: string;
}

interface PipelineConfig {
  serviceId: string;
  callbackUrl: string;
  pipelineInferenceAPIEndPoint: {
    inferenceApiKey: {
      name: string;
      value: string;
    };
    callbackUrl: string;
  };
}

/**
 * Get Bhashini credentials from environment
 */
const getBhashiniConfig = (): BhashiniConfig => {
  const userId = process.env.BHASHINI_USER_ID;
  const ulcaApiKey = process.env.BHASHINI_API_KEY;

  if (!userId || !ulcaApiKey) {
    throw new Error('Bhashini credentials not configured. Set BHASHINI_USER_ID and BHASHINI_API_KEY in .env');
  }

  return { userId, ulcaApiKey };
};

/**
 * Get pipeline configuration for ASR
 */
export const getPipelineConfig = async (language: string): Promise<PipelineConfig> => {
  try {
    const config = getBhashiniConfig();
    const languageCode = LANGUAGE_CODES[language] || 'kn';

    const response = await axios.post(
      `${BHASHINI_BASE_URL}${BHASHINI_PIPELINE_ENDPOINT}`,
      {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: {
                sourceLanguage: languageCode
              }
            }
          }
        ],
        pipelineRequestConfig: {
          pipelineId: '64392f96daac500b55c543cd'
        }
      },
      {
        headers: {
          'userID': config.userId,
          'ulcaApiKey': config.ulcaApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const pipelineData = response.data.pipelineResponseConfig[0];
    return {
      serviceId: pipelineData.config[0].serviceId,
      callbackUrl: pipelineData.config[0].callbackUrl,
      pipelineInferenceAPIEndPoint: pipelineData.config[0].pipelineInferenceAPIEndPoint
    };

  } catch (error: any) {
    console.error('Bhashini pipeline config error:', error.response?.data || error.message);
    throw new Error(`Failed to get Bhashini pipeline config: ${error.message}`);
  }
};

/**
 * Convert audio file to base64
 */
const audioToBase64 = (filePath: string): string => {
  const audioBuffer = fs.readFileSync(filePath);
  return audioBuffer.toString('base64');
};

/**
 * Transcribe audio using Bhashini ASR
 */
export const transcribeWithBhashini = async (
  audioFilePath: string,
  language: string = 'kn'
): Promise<string> => {
  try {
    console.log(`🇮🇳 Starting Bhashini ASR for language: ${language}`);

    // Step 1: Get pipeline configuration
    const pipelineConfig = await getPipelineConfig(language);
    console.log('✅ Got Bhashini pipeline config');

    // Step 2: Convert audio to base64
    const audioBase64 = audioToBase64(audioFilePath);
    console.log('✅ Converted audio to base64');

    // Step 3: Make ASR request
    const languageCode = LANGUAGE_CODES[language] || 'kn';
    const computeUrl = pipelineConfig.pipelineInferenceAPIEndPoint.callbackUrl;
    const authName = pipelineConfig.pipelineInferenceAPIEndPoint.inferenceApiKey.name;
    const authValue = pipelineConfig.pipelineInferenceAPIEndPoint.inferenceApiKey.value;

    const asrResponse = await axios.post(
      computeUrl,
      {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: {
                sourceLanguage: languageCode
              },
              serviceId: pipelineConfig.serviceId,
              audioFormat: 'wav',
              samplingRate: 16000
            }
          }
        ],
        inputData: {
          audio: [
            {
              audioContent: audioBase64
            }
          ]
        }
      },
      {
        headers: {
          [authName]: authValue,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      }
    );

    // Extract transcription from response
    const transcription = asrResponse.data.pipelineResponse[0]?.output[0]?.source || '';
    console.log('✅ Bhashini transcription completed');

    return transcription;

  } catch (error: any) {
    console.error('Bhashini transcription error:', error.response?.data || error.message);
    throw new Error(`Bhashini transcription failed: ${error.message}`);
  }
};

/**
 * Check if Bhashini is configured and available
 */
export const isBhashiniAvailable = (): boolean => {
  try {
    getBhashiniConfig();
    return true;
  } catch {
    return false;
  }
};
