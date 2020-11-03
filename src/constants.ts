export const HEADING_REGEX = /^[#\s-]*/;
export const HEADING_FORMAT = '#';

export const DEFAULT_DATE_FORMAT = 'YYYYMMDDHHmm';
export const DATE_REGEX = /(?<target>{{date:?(?<date>[^}]*)}})/g;

export const FILE_NAME_REGEX = /[#*"\/\\<>:|\[\]\?]/gim;
