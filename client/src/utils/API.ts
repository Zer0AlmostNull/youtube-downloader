import axios from 'axios';
import { host } from './helpers';

export const API = axios.create({
  baseURL: host,
  responseType: 'json',
});


export const getMetadata = async (url: string, onDownloadStartedCallback?: Function) => {
  if (typeof onDownloadStartedCallback === 'function') {
    //    onDownloadStartedCallback();
  }

  return await API.get(`/metainfo?url=${url}`, {
    onDownloadProgress: (eventProgress) => { if (eventProgress.loaded === 0 && (typeof onDownloadStartedCallback === 'function')) onDownloadStartedCallback(); },
  });
};

export const sendContactForm = async (formData: { email: string, issueType: string, description: string }) => {
  return await API.post(`/contact`, formData);
};
