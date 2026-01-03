import { SetMetadata } from '@nestjs/common';

export const SOCIETY_KEY = 'society';
export const Society = () => SetMetadata(SOCIETY_KEY, true);

