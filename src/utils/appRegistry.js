import { FileText, Folder, Palette, MessageSquare, Slice, ChessRook, Image, Globe, Play, SquareGanttChartIcon, Calendar as CalendarIcon, Terminal as TerminalIcon, Code2, RefreshCw } from 'lucide-react';
import TextEditor from '../components/apps/TextEditor/TextEditor';
import FileManager from '../components/apps/FileManager/FileManager';
import ImageViewer from '../components/apps/ImageViewer/ImageViewer';
import MediaPlayer from '../components/apps/MediaPlayer/MediaPlayer';
import { BrowserApp } from '../components/apps/browser/BrowserApp';
import Calendar from '../components/apps/Calendar/Calendar';
import Terminal from '../components/apps/Terminal/Terminal';
import CodeEditor from '../components/apps/CodeEditor/CodeEditor';
import FileConverter from '../components/apps/FileConverter/FileConverter';
import { SketchApp } from '../components/apps/Sketch/SketchApp';
import Breeze from '../components/apps/Breeze/Breeze';
import VideoEditor from '../components/apps/VideoEditor/VideoEditor';
import ScreenRipper from '../components/apps/ScreenRipper';
import SpreadSheet from '../components/apps/SpreadSheet/SpreadSheet';
import ChessApp from '../components/apps/Chess/ChessApp';

export const appRegistry = {
  Chess: {
    Component: ChessApp,
    icon: ChessRook,
    title: 'Chess',
    name: 'Chess',
    defaultSize: { minwidth: 1200, minheight: 1400 },
    resizable: false
  },
  Codex: {
    Component: CodeEditor,
    icon: Code2,
    title: 'Codex | IDE',
    name: 'Codex',
    defaultSize: { minwidth: 1800, minheight: 1600 },
    resizable: true
  },
  spreadsheet: {
    Component: SpreadSheet,
    icon: SquareGanttChartIcon,
    title: 'X-Cells | SpreadSheets',
    name: 'X-Cells',
    defaultSize: { minwidth: 1800, minheight: 1600 },
    resizable: true
  },
  canvas: {
    Component: SketchApp,
    icon: Palette,
    title: 'Sketchy | Creator Core',
    name: 'Sketchy',
    defaultSize: { minwidth: 1800, minheight: 1600 },
    resizable: true,
    singleton: false
  },
  text: {
    Component: TextEditor,
    icon: FileText,
    title: 'AirWrite | Rich Text Editing',
    name: 'AirWrite'
  },
  Breeze: {
    Component: Breeze,
    icon: MessageSquare,
    title: 'Breeze | Messaging and Circles',
    name: 'Breeze'
  },
  FileManager: {
    Component: FileManager,
    icon: Folder,
    title: 'File Manager',
    name: 'File Manager'
  },
  Converter: {
    Component: FileConverter,
    icon: RefreshCw,
    title: 'File Crucible | Converter Utility',
    name: 'File Crucible'
  },
  image: {
    Component: ImageViewer,
    icon: Image,
    title: 'AfterImage | Photo App & Editor',
    name: 'AfterImage'
  },
  video: {
    Component: MediaPlayer,
    icon: Play,
    title: 'AirStream Media Player',
    name: 'Airstream Player'
  },
  ReelSmith: {
    Component: VideoEditor,
    icon: Slice,
    title: 'ReelSmith | Video Editor',
    name: 'ReelSmith'
  },
  Browser: {
    Component: BrowserApp,
    icon: Globe,
    title: 'Browser',
    name: 'Browser'
  },
  Calendar: {
    Component: Calendar,
    icon: CalendarIcon,
    title: 'Calendar',
    name: 'Calendar'
  },
  Terminal: {
    Component: Terminal,
    icon: TerminalIcon,
    title: 'Terminal',
    name: 'Terminal'
  },
  ScreenRecord: {
    Component: ScreenRipper,
    icon: Play,
    title: 'Screen Ripper',
    name: 'Screen Ripper'
  }
};

export const appCategories = {
  productivity: {
    name: 'Productivity',
    icon: '💼',
    apps: ['text', 'FileManager', 'Converter', 'Calendar', 'spreadsheet', 'Breeze']
  },
  creativity: {
    name: 'Create',
    icon: '🎨',
    apps: ['image', 'video', 'ReelSmith', 'canvas', 'text']
  },
  developertools: {
    name: 'Developer Tools',
    icon: '###',
    apps: ['Codex', 'Terminal']
  },
  entertainment: {
    name: 'Entertainment',
    icon: '🎮',
    apps: ['video', 'Browser', 'ScreenRecord', 'Chess']
  }
};

export const getCategorizedApps = () => {
  const categorized = {};
  
  Object.entries(appCategories).forEach(([key, category]) => {
    categorized[key] = {
      ...category,
      apps: category.apps.map(appKey => ({
        key: appKey,
        ...appRegistry[appKey]
      }))
    };
  });
  
  return categorized;
};

export const desktopApps = [
  { name: 'File Manager', icon: Folder, app: 'FileManager' },
  { name: 'ReelSmith', icon: Slice, app: 'ReelSmith' },
  { name: 'Terminal', icon: TerminalIcon, app: 'Terminal' },
  { name: 'Codex', icon: Code2, app: 'Codex' },
  { name: 'File Crucible', icon: RefreshCw, app: 'Converter' },

];