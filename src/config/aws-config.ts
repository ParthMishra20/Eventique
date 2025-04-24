import { Amplify } from 'aws-amplify';

console.log('ENV vars check:', {
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
  identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
  bucket: import.meta.env.VITE_S3_BUCKET_NAME
});

// Updated configuration structure for Amplify v6+
export const awsConfig = {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION,
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID
    }
  },
  Storage: {
    S3: {
      region: import.meta.env.VITE_AWS_REGION,
      bucket: import.meta.env.VITE_S3_BUCKET_NAME
    }
  },
  API: {
    REST: {
      'eventique-api': {
        endpoint: import.meta.env.VITE_API_GATEWAY_URL,
        region: import.meta.env.VITE_AWS_REGION
      }
    }
  }
};

// Try-catch for better error handling
try {
  Amplify.configure(awsConfig);
  console.log('Amplify configured successfully');
} catch (error) {
  console.error('Error configuring Amplify:', error);
}