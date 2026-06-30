import React, { useState, useRef, useEffect } from 'react';
import { Customer, Region } from '../types';
import { 
  Map, MapPin, Sliders, Server, Plus, Edit3, Trash2, Check, Info, Radio,
  Layers, Settings, Route, TrendingUp, RefreshCw, Save, X, Network, Eye, Activity
} from 'lucide-react';
import NeonBox from './NeonBox';

interface GponMapsProps {
  customers: Customer[];
  regions: Region[];
}

export interface OdcNode {
  id: string;
  name: string;
  region: Region;
  address: string;
  x: number; // local percentage width 0-100
  y: number; // local percentage height 0-100
  status: 'active' | 'warning' | 'maintenance';
  totalCore: number;
  usedCore: number;
}

export interface OdpNode {
  id: string;
  name: string;
  odcId: string; // link to source ODC
  streetName: string;
  x: number;
  y: number;
  status: 'active' | 'full' | 'maintenance';
  splitterRatio: '1:8' | '1:16' | '1:32';
  usedPorts: number;
  opticalLoss: number; // in -dBm
}

export interface StreetOverlay {
  id: string;
  name: string;
  region: Region;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Global Coordinate Transformation System for the 3x2 Grid layout
export const REGION_OFFSETS: Record<Region, { offsetX: number; offsetY: number; width: number; height: number; title: string; color: string }> = {
  'BEKASI wilayah Jatimakmur': { offsetX: 40, offsetY: 40, width: 440, height: 340, title: 'BEKASI SEKTOR JATIMAKMUR', color: '#06b6d4' },
  'BEKASI wilayah Jatiasih': { offsetX: 540, offsetY: 40, width: 440, height: 340, title: 'BEKASI SEKTOR JATIASIH', color: '#10b981' },
  'BEKASI wilayah Dewi sartika': { offsetX: 1040, offsetY: 40, width: 440, height: 340, title: 'BEKASI SEKTOR DEWI SARTIKA', color: '#3b82f6' },
  'CIKARANG Desa Cibarusah': { offsetX: 40, offsetY: 440, width: 440, height: 340, title: 'CIKARANG SEKTOR CIBARUSAH', color: '#f59e0b' },
  'CIKARANG Desa Sukatani': { offsetX: 540, offsetY: 440, width: 440, height: 340, title: 'CIKARANG SEKTOR SUKATANI', color: '#ec4899' },
  'CIKARANG Desa Jatibaru': { offsetX: 1040, offsetY: 440, width: 440, height: 340, title: 'CIKARANG SEKTOR JATIBARU', color: '#a855f7' },
};

export const getGlobalCoords = (region: Region, localX: number, localY: number) => {
  const config = REGION_OFFSETS[region];
  if (!config) return { x: 0, y: 0 };
  return {
    x: config.offsetX + (localX / 100) * config.width,
    y: config.offsetY + (localY / 100) * config.height,
  };
};

export default function GponMapsMenu({ customers, regions }: GponMapsProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region>('BEKASI wilayah Jatimakmur');

  // Multi-region ODC Cabinets database
  const [odcs, setOdcs] = useState<OdcNode[]>([
    { id: 'ODC-CKR-SUKATANI-01', name: 'ODC-SUKATANI-PST-01', region: 'CIKARANG Desa Sukatani', address: 'Jl. Raya Sukatani No. 10', x: 50, y: 50, status: 'active', totalCore: 144, usedCore: 84 },
    { id: 'ODC-CKR-SUKATANI-02', name: 'ODC-SUKAMANAH-PST-02', region: 'CIKARANG Desa Sukatani', address: 'Jl. Sukamanah No. 80', x: 25, y: 75, status: 'active', totalCore: 96, usedCore: 62 },
    
    { id: 'ODC-BKS-JATIMAKMUR-01', name: 'ODC-JATIMAKMUR-PST-01', region: 'BEKASI wilayah Jatimakmur', address: 'Jl. Jatimakmur No. 12', x: 50, y: 45, status: 'active', totalCore: 144, usedCore: 92 },
    { id: 'ODC-BKS-JATIMAKMUR-02', name: 'ODC-JATIBENING-02', region: 'BEKASI wilayah Jatimakmur', address: 'Jl. Jatibening No. 5', x: 30, y: 80, status: 'active', totalCore: 96, usedCore: 48 },

    { id: 'ODC-BKS-JATIASIH-01', name: 'ODC-JATIASIH-RAYA-01', region: 'BEKASI wilayah Jatiasih', address: 'Jl. Jatiasih No. 4', x: 45, y: 40, status: 'warning', totalCore: 144, usedCore: 120 },
    { id: 'ODC-BKS-JATIASIH-02', name: 'ODC-JATIMEKAR-02', region: 'BEKASI wilayah Jatiasih', address: 'Jl. Jatimekar No. 19', x: 70, y: 75, status: 'active', totalCore: 96, usedCore: 32 },

    { id: 'ODC-BKS-DEWISARTIKA-01', name: 'ODC-DEWI-SARTIKA-01', region: 'BEKASI wilayah Dewi sartika', address: 'Jl. Dewi Sartika No. 34', x: 50, y: 50, status: 'active', totalCore: 144, usedCore: 88 },
    { id: 'ODC-CKR-CIBARUSAH-01', name: 'ODC-CIBARUSAH-01', region: 'CIKARANG Desa Cibarusah', address: 'Jl. Raya Cibarusah No. 4', x: 50, y: 50, status: 'active', totalCore: 144, usedCore: 98 },
    { id: 'ODC-CKR-JATIBARU-01', name: 'ODC-JATIBARU-01', region: 'CIKARANG Desa Jatibaru', address: 'Jl. Raya Jatibaru No. 100', x: 50, y: 50, status: 'active', totalCore: 144, usedCore: 104 },
  ]);

  // Multi-region ODP Splitters database
  const [odps, setOdps] = useState<OdpNode[]>([
    // Cikarang Sukatani ODPs
    { id: 'ODP-KMG-01', name: 'ODP-CKR-SKT-01', odcId: 'ODC-CKR-SUKATANI-01', streetName: 'Jl. Raya Sukatani', x: 50, y: 15, status: 'active', splitterRatio: '1:8', usedPorts: 6, opticalLoss: 19.8 },
    { id: 'ODP-KMG-02', name: 'ODP-CKR-SKT-02', odcId: 'ODC-CKR-SUKATANI-01', streetName: 'Jl. Raya Sukatani', x: 75, y: 35, status: 'active', splitterRatio: '1:16', usedPorts: 14, opticalLoss: 21.2 },
    { id: 'ODP-FTM-01', name: 'ODP-CKR-SKH-01', odcId: 'ODC-CKR-SUKATANI-02', streetName: 'Jl. Sukamanah', x: 15, y: 45, status: 'full', splitterRatio: '1:8', usedPorts: 8, opticalLoss: 23.5 },
    { id: 'ODP-FTM-02', name: 'ODP-CKR-SKH-02', odcId: 'ODC-CKR-SUKATANI-02', streetName: 'Jl. Sukamanah', x: 25, y: 20, status: 'active', splitterRatio: '1:16', usedPorts: 10, opticalLoss: 20.4 },
    { id: 'ODP-PLM-01', name: 'ODP-CKR-SKR-01', odcId: 'ODC-CKR-SUKATANI-01', streetName: 'Jl. Sukarukun', x: 80, y: 70, status: 'maintenance', splitterRatio: '1:8', usedPorts: 3, opticalLoss: 28.1 },
    { id: 'ODP-PLM-02', name: 'ODP-CKR-SKR-02', odcId: 'ODC-CKR-SUKATANI-01', streetName: 'Jl. Sukarukun', x: 60, y: 85, status: 'active', splitterRatio: '1:16', usedPorts: 12, opticalLoss: 22.0 },

    // Bekasi Jatimakmur ODPs
    { id: 'ODP-BDG-DGO-01', name: 'ODP-BKS-JKM-01', odcId: 'ODC-BKS-JATIMAKMUR-01', streetName: 'Jl. Jatimakmur', x: 50, y: 15, status: 'active', splitterRatio: '1:16', usedPorts: 11, opticalLoss: 19.5 },
    { id: 'ODP-BDG-DGO-02', name: 'ODP-BKS-JKM-02', odcId: 'ODC-BKS-JATIMAKMUR-01', streetName: 'Jl. Jatimakmur', x: 80, y: 30, status: 'active', splitterRatio: '1:8', usedPorts: 7, opticalLoss: 20.8 },
    { id: 'ODP-BDG-PJJ-01', name: 'ODP-BKS-JTB-01', odcId: 'ODC-BKS-JATIMAKMUR-02', streetName: 'Jl. Jatibening', x: 15, y: 65, status: 'full', splitterRatio: '1:8', usedPorts: 8, opticalLoss: 24.1 },
    { id: 'ODP-BDG-PJJ-02', name: 'ODP-BKS-JTB-02', odcId: 'ODC-BKS-JATIMAKMUR-02', streetName: 'Jl. Jatibening', x: 25, y: 25, status: 'active', splitterRatio: '1:16', usedPorts: 8, opticalLoss: 21.0 },

    // Bekasi Jatiasih ODPs
    { id: 'ODP-BGR-PJJ-01', name: 'ODP-BKS-JAS-01', odcId: 'ODC-BKS-JATIASIH-01', streetName: 'Jl. Jatiasih', x: 15, y: 30, status: 'active', splitterRatio: '1:8', usedPorts: 4, opticalLoss: 19.9 },
    { id: 'ODP-BGR-PJJ-02', name: 'ODP-BKS-JAS-02', odcId: 'ODC-BKS-JATIASIH-01', streetName: 'Jl. Jatiasih', x: 80, y: 25, status: 'full', splitterRatio: '1:16', usedPorts: 16, opticalLoss: 25.4 },
    { id: 'ODP-BGR-JND-01', name: 'ODP-BKS-JMK-01', odcId: 'ODC-BKS-JATIASIH-02', streetName: 'Jl. Jatimekar', x: 55, y: 85, status: 'active', splitterRatio: '1:16', usedPorts: 11, opticalLoss: 21.6 },

    // Bekasi Dewi Sartika ODPs
    { id: 'ODP-JKE-JAT-01', name: 'ODP-BKS-DWS-01', odcId: 'ODC-BKS-DEWISARTIKA-01', streetName: 'Jl. Dewi Sartika', x: 80, y: 30, status: 'active', splitterRatio: '1:16', usedPorts: 12, opticalLoss: 20.2 },
    { id: 'ODP-JKE-JAT-02', name: 'ODP-BKS-DWS-02', odcId: 'ODC-BKS-DEWISARTIKA-01', streetName: 'Jl. Dewi Sartika', x: 25, y: 70, status: 'active', splitterRatio: '1:8', usedPorts: 5, opticalLoss: 21.9 },
    { id: 'ODP-JKE-RAW-01', name: 'ODP-BKS-MGY-01', odcId: 'ODC-BKS-DEWISARTIKA-01', streetName: 'Jl. Margahayu', x: 45, y: 20, status: 'active', splitterRatio: '1:16', usedPorts: 9, opticalLoss: 20.6 },

    // Cikarang Cibarusah ODPs
    { id: 'ODP-JKB-TMG-01', name: 'ODP-CKR-CBS-01', odcId: 'ODC-CKR-CIBARUSAH-01', streetName: 'Jl. Raya Cibarusah', x: 15, y: 45, status: 'active', splitterRatio: '1:8', usedPorts: 6, opticalLoss: 19.3 },
    { id: 'ODP-JKB-TMG-02', name: 'ODP-CKR-CBS-02', odcId: 'ODC-CKR-CIBARUSAH-01', streetName: 'Jl. Raya Cibarusah', x: 85, y: 55, status: 'full', splitterRatio: '1:16', usedPorts: 16, opticalLoss: 24.8 },

    // Cikarang Jatibaru ODPs
    { id: 'ODP-TGR-BSD-01', name: 'ODP-CKR-JTB-01', odcId: 'ODC-CKR-JATIBARU-01', streetName: 'Jl. Raya Jatibaru', x: 30, y: 25, status: 'active', splitterRatio: '1:16', usedPorts: 13, opticalLoss: 21.1 },
    { id: 'ODP-TGR-BSD-02', name: 'ODP-CKR-JTB-02', odcId: 'ODC-CKR-JATIBARU-01', streetName: 'Jl. Raya Jatibaru', x: 70, y: 75, status: 'active', splitterRatio: '1:8', usedPorts: 7, opticalLoss: 20.4 },
  ]);

  // Street Overlays to display real street routes on top of our canvas
  const [streets] = useState<StreetOverlay[]>([
    // Cikarang Sukatani
    { id: 'ST-01', name: 'Jl. Raya Sukatani', region: 'CIKARANG Desa Sukatani', x1: 50, y1: 5, x2: 50, y2: 95 },
    { id: 'ST-02', name: 'Jl. Sukamanah', region: 'CIKARANG Desa Sukatani', x1: 5, y1: 30, x2: 95, y2: 30 },
    { id: 'ST-03', name: 'Jl. Sukarukun', region: 'CIKARANG Desa Sukatani', x1: 15, y1: 80, x2: 85, y2: 80 },

    // Bekasi Jatimakmur
    { id: 'ST-BDG-01', name: 'Jl. Jatimakmur', region: 'BEKASI wilayah Jatimakmur', x1: 50, y1: 5, x2: 50, y2: 95 },
    { id: 'ST-BDG-02', name: 'Jl. Jatibening', region: 'BEKASI wilayah Jatimakmur', x1: 5, y1: 45, x2: 95, y2: 45 },
    { id: 'ST-BDG-03', name: 'Jl. Jatiwaringin', region: 'BEKASI wilayah Jatimakmur', x1: 20, y1: 15, x2: 80, y2: 75 },

    // Bekasi Jatiasih
    { id: 'ST-BGR-01', name: 'Jl. Jatiasih', region: 'BEKASI wilayah Jatiasih', x1: 20, y1: 10, x2: 80, y2: 90 },
    { id: 'ST-BGR-02', name: 'Jl. Jatimekar', region: 'BEKASI wilayah Jatiasih', x1: 10, y1: 50, x2: 90, y2: 50 },

    // Bekasi Dewi Sartika
    { id: 'ST-JKE-01', name: 'Jl. Dewi Sartika', region: 'BEKASI wilayah Dewi sartika', x1: 50, y1: 5, x2: 50, y2: 95 },
    { id: 'ST-JKE-02', name: 'Jl. Margahayu', region: 'BEKASI wilayah Dewi sartika', x1: 10, y1: 40, x2: 90, y2: 40 },

    // Cikarang Cibarusah
    { id: 'ST-JKB-01', name: 'Jl. Raya Cibarusah', region: 'CIKARANG Desa Cibarusah', x1: 10, y1: 10, x2: 90, y2: 90 },
    { id: 'ST-JKB-02', name: 'Jl. Sirnajaya', region: 'CIKARANG Desa Cibarusah', x1: 10, y1: 80, x2: 90, y2: 20 },

    // Cikarang Jatibaru
    { id: 'ST-TGR-01', name: 'Jl. Raya Jatibaru', region: 'CIKARANG Desa Jatibaru', x1: 50, y1: 5, x2: 50, y2: 95 },
    { id: 'ST-TGR-02', name: 'Jl. Jatireja', region: 'CIKARANG Desa Jatibaru', x1: 5, y1: 50, x2: 95, y2: 50 },
  ]);

  // View interactive scale states for zooming & dragging
  const [scale, setScale] = useState<number>(0.65); // Zoom slightly out initially to show all 6 regions beautiful layout
  const [panX, setPanX] = useState<number>(100);
  const [panY, setPanY] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const touchStartRef = useRef<{ dist: number; scale: number } | null>(null);

  // Focus detail states
  const [selectedOdcId, setSelectedOdcId] = useState<string | null>(null);
  const [selectedOdpId, setSelectedOdpId] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState<'none' | 'odc' | 'odp'>('none');
  
  // Custom forms state for creating nodes
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStreetName, setFormStreetName] = useState('');
  const [formOdcId, setFormOdcId] = useState('');
  const [formSplitter, setFormSplitter] = useState<'1:8' | '1:16' | '1:32'>('1:8');
  const [formTotalCore, setFormTotalCore] = useState(96);
  const [formUsedCore, setFormUsedCore] = useState(30);
  const [formUsedPorts, setFormUsedPorts] = useState(4);
  const [formX, setFormX] = useState(50);
  const [formY, setFormY] = useState(50);
  
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active region filters for side metrics and selectors
  const activeOdcs = odcs.filter(o => o.region === selectedRegion);
  const activeOdps = odps.filter(odp => activeOdcs.some(odc => odc.id === odp.odcId));
  const activeStreets = streets.filter(s => s.region === selectedRegion);
  
  // Active detailed nodes
  const currentOdc = odcs.find(o => o.id === selectedOdcId);
  const currentOdp = odps.find(o => o.id === selectedOdpId);

  // Interactive smooth "Focus Fly-To" action
  const focusOnSector = (region: Region) => {
    const config = REGION_OFFSETS[region];
    if (!config) return;
    
    const targetScale = 1.35;
    const centerX = config.offsetX + config.width / 2;
    const centerY = config.offsetY + config.height / 2;
    
    // Smooth transition
    setSelectedRegion(region);
    setScale(targetScale);
    setPanX(760 - centerX * targetScale);
    setPanY(420 - centerY * targetScale);
  };

  // Zoom on wheel scroll
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    let newScale = scale * zoomFactor;
    newScale = Math.min(4, Math.max(0.3, newScale));
    setScale(newScale);
  };

  // Drag-To-Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click drag
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    setHasMoved(false);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
    setHasMoved(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Panning and Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY });
      setHasMoved(false);
      touchStartRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current = { dist, scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPanX(touch.clientX - dragStart.x);
      setPanY(touch.clientY - dragStart.y);
      setHasMoved(true);
    } else if (e.touches.length === 2 && touchStartRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchStartRef.current.dist;
      let newScale = touchStartRef.current.scale * factor;
      newScale = Math.min(4, Math.max(0.3, newScale));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  // Click handler directly mapping back coordinates from zoom/pan viewport
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasMoved) return; // Don't click while dragging
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale to viewBox coordinates
    const vbX = (clickX / rect.width) * 1520;
    const vbY = (clickY / rect.height) * 840;

    // Un-apply the pan & scale
    const globalX = (vbX - panX) / scale;
    const globalY = (vbY - panY) / scale;

    // Check which region/sector boundary was targeted
    let detectedRegion: Region | null = null;
    let localX = 50;
    let localY = 50;

    for (const [r, config] of Object.entries(REGION_OFFSETS)) {
      if (
        globalX >= config.offsetX &&
        globalX <= config.offsetX + config.width &&
        globalY >= config.offsetY &&
        globalY <= config.offsetY + config.height
      ) {
        detectedRegion = r as Region;
        localX = Math.round(((globalX - config.offsetX) / config.width) * 100);
        localY = Math.round(((globalY - config.offsetY) / config.height) * 100);
        break;
      }
    }

    if (detectedRegion) {
      setSelectedRegion(detectedRegion);
      if (isAddingNode !== 'none') {
        setFormX(Math.min(95, Math.max(5, localX)));
        setFormY(Math.min(95, Math.max(5, localY)));
      } else {
        // Clear active selection if clicked on background empty area
        setSelectedOdcId(null);
        setSelectedOdpId(null);
      }
    }
  };

  // Form submit for ODC Add
  const handleAddOdc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) return;

    const newId = `ODC-CUSTOM-${Math.floor(100 + Math.random() * 900)}`;
    const newNode: OdcNode = {
      id: newId,
      name: formName.trim().toUpperCase(),
      region: selectedRegion,
      address: formAddress.trim(),
      x: Number(formX),
      y: Number(formY),
      status: 'active',
      totalCore: Number(formTotalCore),
      usedCore: Number(formUsedCore)
    };

    setOdcs(prev => [...prev, newNode]);
    setActionSuccess(`SUKSES: Cabinet ODC baru [ ${newNode.name} ] berhasil dikoordinasikan!`);
    resetForm();
    setSelectedOdcId(newId);
    setSelectedOdpId(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Form submit for ODP Add
  const handleAddOdp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOdcId) return;

    const newId = `ODP-CUSTOM-${Math.floor(100 + Math.random() * 900)}`;
    const newNode: OdpNode = {
      id: newId,
      name: formName.trim().toUpperCase(),
      odcId: formOdcId,
      streetName: formStreetName || activeStreets[0]?.name || 'Jl. Utama',
      x: Number(formX),
      y: Number(formY),
      status: 'active',
      splitterRatio: formSplitter,
      usedPorts: Number(formUsedPorts),
      opticalLoss: Number((18 + Math.random() * 5).toFixed(1))
    };

    setOdps(prev => [...prev, newNode]);
    setOdcs(prev => prev.map(o => o.id === formOdcId ? { ...o, usedCore: Math.min(o.totalCore, o.usedCore + 1) } : o));

    setActionSuccess(`SUKSES: Splitter ODP baru [ ${newNode.name} ] dipasang & ditarik kabel dari ODC!`);
    resetForm();
    setSelectedOdpId(newId);
    setSelectedOdcId(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const removeOdc = (id: string) => {
    setOdcs(prev => prev.filter(o => o.id !== id));
    setOdps(prev => prev.filter(odp => odp.odcId !== id)); // cascade
    setSelectedOdcId(null);
    setActionSuccess('SUKSES: Terminal ODC & seluruh distribusi kabel ODP di dalamnya berhasil dilepas.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const removeOdp = (id: string) => {
    setOdps(prev => prev.filter(o => o.id !== id));
    setSelectedOdpId(null);
    setActionSuccess('SUKSES: ODP berhasil dilepaskan dari jalur topologi distribusinya.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const resetForm = () => {
    setFormName('');
    setFormAddress('');
    setFormStreetName('');
    setFormTotalCore(96);
    setFormUsedCore(24);
    setFormUsedPorts(5);
    setIsAddingNode('none');
    setFormX(30 + Math.floor(Math.random() * 40));
    setFormY(30 + Math.floor(Math.random() * 40));
  };

  const computeDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.floor(Math.sqrt(dx * dx + dy * dy) * 12);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Board */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-slate-950 p-4 border border-slate-900 rounded gap-4">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider">
              PETA MULTI-SEKTOR GPON INTEGRASI (6 WILAYAH)
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              Visualisasi terpadu seluruh Ring OLT, Terminal ODC, dan Jalur Distribusi ODP dalam Satu Layar
            </p>
          </div>
        </div>

        {/* Region drop selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Fokus Sektor Wilayah:</span>
          <select
            value={selectedRegion}
            onChange={(e) => focusOnSector(e.target.value as Region)}
            className="bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs px-3 py-1.5 focus:outline-none focus:border-cyan-400 rounded cursor-pointer uppercase font-bold"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setScale(0.65);
              setPanX(100);
              setPanY(50);
            }}
            className="px-2.5 py-1.5 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 rounded font-mono text-[10px] uppercase font-semibold flex items-center gap-1 transition-all"
            title="Reset to Unified Global View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            GLOBAL VIEW
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500 text-emerald-400 font-mono text-xs uppercase rounded animate-fadeIn shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center gap-2">
          <Check className="w-4 h-4" />
          {actionSuccess}
        </div>
      )}

      {/* Main Map Grid & Side Editor Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left/Middle Column: Beautiful SVG mapping system */}
        <div className="xl:col-span-3 space-y-4">
          <div className="relative border border-slate-900 bg-slate-950 rounded overflow-hidden aspect-video w-full shadow-[inset_0_0_40px_rgba(0,0,0,0.85)]">
            
            {/* Visual HUD Header */}
            <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur border border-white/5 py-1.5 px-2.5 rounded font-mono text-[9px] uppercase tracking-wider space-y-1 text-slate-300">
              <span className="font-extrabold text-cyan-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                ACTIVE FOCUS: {selectedRegion.toUpperCase()}
              </span>
              <p className="text-slate-500">
                CORE BACKHAUL TRANSIT CAPACITY: 100 Gbps METRO RING
              </p>
            </div>
            {/* Area Editor Selector Toggle inside Map box */}
            <div className="absolute top-3 right-3 z-10 bg-slate-950/95 border border-slate-800 p-1.5 rounded flex items-center gap-1 select-none">
              <button
                onClick={() => {
                  setIsAddingNode(isAddingNode === 'odc' ? 'none' : 'odc');
                  setFormName(`ODC-${selectedRegion.substring(selectedRegion.lastIndexOf(' ') + 1, selectedRegion.lastIndexOf(' ') + 4).toUpperCase()}-NEW`);
                  setFormOdcId('');
                }}
                className={`px-2 py-1.5 rounded text-[9px] font-bold font-mono uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                  isAddingNode === 'odc' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                + ODC INDUK
              </button>
              <button
                onClick={() => {
                  setIsAddingNode(isAddingNode === 'odp' ? 'none' : 'odp');
                  setFormName(`ODP-${selectedRegion.substring(selectedRegion.lastIndexOf(' ') + 1, selectedRegion.lastIndexOf(' ') + 4).toUpperCase()}-NEW`);
                  setFormOdcId(activeOdcs[0]?.id || '');
                }}
                disabled={activeOdcs.length === 0}
                className={`px-2 py-1.5 rounded text-[9px] font-bold font-mono uppercase flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-30 ${
                  isAddingNode === 'odp' 
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.3)]' 
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                + ODP SPLITTER
              </button>
            </div>

            {/* Interactive Zoom/Drag HUD Controls */}
            <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 bg-slate-950/95 border border-slate-800 p-1.5 rounded shadow-lg select-none">
              <button
                onClick={() => setScale(s => Math.min(4, s + 0.15))}
                className="w-8 h-8 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-400 text-white border border-slate-800 rounded flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setScale(s => Math.max(0.3, s - 0.15))}
                className="w-8 h-8 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-400 text-white border border-slate-800 rounded flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => {
                  setScale(0.65);
                  setPanX(100);
                  setPanY(50);
                }}
                className="px-1 py-1 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-400 text-slate-400 border border-slate-800 rounded font-mono text-[8px] uppercase tracking-tighter cursor-pointer text-center transition-colors font-bold"
                title="Reset View"
              >
                RESET
              </button>
            </div>

            <div className="absolute bottom-3 left-16 z-10 bg-slate-950/80 backdrop-blur border border-white/5 px-2.5 py-1.5 rounded font-mono text-[8px] uppercase text-slate-400 select-none hidden md:block">
              🖱️ Scroll Wheel untuk Zoom • Geser/Drag untuk Pan Peta
            </div>

            {/* SVG Unified Canvas */}
            <svg 
              ref={svgRef}
              viewBox="0 0 1520 840"
              className="w-full h-full text-slate-800 font-mono bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950/90 via-slate-950 to-slate-955 select-none touch-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onWheel={handleWheel}
              onClick={handleMapClick}
            >
              <defs>
                {/* Visual grid line matrix pattern */}
                <pattern id="gpon-grid-global" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.012)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="1" fill="rgba(6, 182, 212, 0.05)" />
                </pattern>
              </defs>
              
              <rect width="100%" height="100%" fill="url(#gpon-grid-global)" />

              {/* TRANSLATED VIEW GROUP */}
              <g transform={`translate(${panX}, ${panY}) scale(${scale})`}>
                
                {/* Sector Grid Boundaries & Names */}
                {Object.entries(REGION_OFFSETS).map(([regionKey, config]) => {
                  const isFocused = selectedRegion === regionKey;
                  return (
                    <g key={`boundary-${regionKey}`}>
                      {/* Sector Banner Label - Borderless Overlay */}
                      <g transform={`translate(${config.offsetX + config.width / 2}, ${config.offsetY + 30})`}>
                        <text
                          x="0"
                          y="0"
                          fill={isFocused ? '#22d3ee' : '#475569'}
                          fillOpacity={isFocused ? '0.8' : '0.5'}
                          fontSize="9.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="font-orbitron tracking-widest font-extrabold select-none"
                        >
                          {config.title}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Road overlays & names across all regions */}
                {streets.map((street) => {
                  const start = getGlobalCoords(street.region, street.x1, street.y1);
                  const end = getGlobalCoords(street.region, street.x2, street.y2);
                  const midX = (start.x + end.x) / 2;
                  const midY = (start.y + end.y) / 2;
                  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

                  return (
                    <g key={street.id} className="opacity-95 text-slate-700/50">
                      {/* Wide Road Path Line */}
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="rgba(30, 41, 59, 0.45)"
                        strokeWidth="24"
                        strokeLinecap="round"
                      />
                      {/* Road dash center lane line */}
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="1.2"
                        strokeDasharray="4,8"
                        strokeLinecap="round"
                      />
                      {/* Street Name Text */}
                      <text
                        x={midX}
                        y={midY + 3}
                        fill="rgba(148, 163, 184, 0.4)"
                        fontSize="8.2"
                        fontWeight="bold"
                        letterSpacing="1.5"
                        textAnchor="middle"
                        transform={`rotate(${angle}, ${midX}, ${midY})`}
                      >
                        {street.name.toUpperCase()}
                      </text>
                    </g>
                  );
                })}

                {/* CENTRAL NOC HUB GATEWAY */}
                <g className="group select-none">
                  <circle
                    cx={760}
                    cy={410}
                    r="24"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                    className="animate-ping"
                    style={{ animationDuration: '6s' }}
                  />
                  <circle
                    cx={760}
                    cy={410}
                    r="16"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    className="animate-ping"
                    style={{ animationDuration: '4s' }}
                  />
                  <circle
                    cx={760}
                    cy={410}
                    r="12"
                    fill="#1e1b4b"
                    fillOpacity="0.6"
                    stroke="#c084fc"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                  <rect
                    x={752}
                    y={402}
                    width="16"
                    height="16"
                    rx="3"
                    fill="#020617"
                    stroke="#f43f5e"
                    strokeWidth="2"
                  />
                  <circle cx={756} cy={406} r="1.2" fill="#10b981" />
                  <circle cx={760} cy={406} r="1.2" fill="#34d399" />
                  <circle cx={764} cy={406} r="1.2" fill="#60a5fa" />
                  <text
                    x={760}
                    y={434}
                    fill="#f43f5e"
                    fontSize="9"
                    fontWeight="black"
                    textAnchor="middle"
                    className="font-orbitron tracking-widest"
                  >
                    NOC CORE AISYAKA
                  </text>
                  <text
                    x={760}
                    y={443}
                    fill="#94a3b8"
                    fontSize="7"
                    textAnchor="middle"
                    className="font-mono tracking-tight"
                  >
                    MAIN CORE HEADEND HUB
                  </text>
                </g>

                {/* OLT BACKHAUL FEEDER RINGS */}
                {regions.map((region) => {
                  const coord = getGlobalCoords(region, 15, 15);
                  return (
                    <g key={`backbone-feed-${region}`}>
                      {/* Glow Feeder path */}
                      <line
                        x1={760}
                        y1={410}
                        x2={coord.x}
                        y2={coord.y}
                        stroke="#ec4899"
                        strokeWidth="4"
                        strokeOpacity="0.08"
                      />
                      {/* Physical fiber ring trace */}
                      <line
                        x1={760}
                        y1={410}
                        x2={coord.x}
                        y2={coord.y}
                        stroke="#db2777"
                        strokeWidth="1.5"
                        strokeOpacity="0.5"
                        strokeDasharray={region.includes('CIKARANG') ? '5,5' : undefined}
                      />
                      {/* White fast light data packets */}
                      <line
                        x1={760}
                        y1={410}
                        x2={coord.x}
                        y2={coord.y}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeDasharray="15, 50"
                        className="animate-dash-fast"
                      />
                    </g>
                  );
                })}

                {/* Metro Ring Backup Ring interconnecting the OLT nodes directly */}
                {(() => {
                  const p1 = getGlobalCoords('BEKASI wilayah Jatimakmur', 15, 15);
                  const p2 = getGlobalCoords('BEKASI wilayah Jatiasih', 15, 15);
                  const p3 = getGlobalCoords('BEKASI wilayah Dewi sartika', 15, 15);
                  const p4 = getGlobalCoords('CIKARANG Desa Jatibaru', 15, 15);
                  const p5 = getGlobalCoords('CIKARANG Desa Sukatani', 15, 15);
                  const p6 = getGlobalCoords('CIKARANG Desa Cibarusah', 15, 15);

                  const ringPoints = [p1, p2, p3, p4, p5, p6, p1];

                  return ringPoints.map((pt, idx) => {
                    if (idx === ringPoints.length - 1) return null;
                    const nextPt = ringPoints[idx + 1];
                    return (
                      <g key={`ring-segment-${idx}`}>
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={nextPt.x}
                          y2={nextPt.y}
                          stroke="#7c3aed"
                          strokeWidth="2.5"
                          strokeOpacity="0.3"
                        />
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={nextPt.x}
                          y2={nextPt.y}
                          stroke="#c084fc"
                          strokeWidth="1.2"
                          strokeDasharray="10, 40"
                          className="animate-dash-medium"
                        />
                      </g>
                    );
                  });
                })()}

                {/* Regional OLT Sektor Stations Nodes */}
                {regions.map((region) => {
                  const coord = getGlobalCoords(region, 15, 15);
                  return (
                    <g key={`olt-${region}`} className="group select-none">
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="12"
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="0.8"
                        strokeOpacity="0.4"
                        className="animate-ping"
                        style={{ animationDuration: '4s' }}
                      />
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="8"
                        fill="#4c1d95"
                        fillOpacity="0.4"
                        stroke="#a855f7"
                        strokeWidth="1.2"
                      />
                      <rect
                        x={coord.x - 7}
                        y={coord.y - 7}
                        width="14"
                        height="14"
                        rx="2.5"
                        fill="#020617"
                        stroke="#c084fc"
                        strokeWidth="1.2"
                      />
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="1.5"
                        fill="#10b981"
                        className="animate-pulse"
                      />
                      <text
                        x={coord.x}
                        y={coord.y + 14}
                        fill="#cbd5e1"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-orbitron font-extrabold tracking-tight"
                      >
                        OLT {region.includes('Jatimakmur') ? 'JKM' : region.includes('Jatiasih') ? 'JAS' : region.includes('Dewi sartika') ? 'DWS' : region.includes('Cibarusah') ? 'CBS' : region.includes('Sukatani') ? 'SKT' : 'JTB'}
                      </text>
                    </g>
                  );
                })}

                {/* OLT To ODC Feeder Distribution Cables */}
                {odcs.map((odc) => {
                  const oltCoord = getGlobalCoords(odc.region, 15, 15);
                  const odcCoord = getGlobalCoords(odc.region, odc.x, odc.y);

                  return (
                    <g key={`feeder-cable-${odc.id}`}>
                      {/* Glowing cable path */}
                      <line
                        x1={oltCoord.x}
                        y1={oltCoord.y}
                        x2={odcCoord.x}
                        y2={odcCoord.y}
                        stroke="#06b6d4"
                        strokeWidth="3.5"
                        strokeOpacity="0.12"
                      />
                      {/* Physical wire */}
                      <line
                        x1={oltCoord.x}
                        y1={oltCoord.y}
                        x2={odcCoord.x}
                        y2={odcCoord.y}
                        stroke="#0891b2"
                        strokeWidth="1.5"
                        strokeOpacity="0.75"
                      />
                      {/* Optical data pulse laser signal */}
                      <line
                        x1={oltCoord.x}
                        y1={oltCoord.y}
                        x2={odcCoord.x}
                        y2={odcCoord.y}
                        stroke="#e0f7fa"
                        strokeWidth="1.2"
                        strokeDasharray="10, 40"
                        className="animate-dash-fast"
                      />
                    </g>
                  );
                })}

                {/* ODC to ODP Fiber Distribution Cables & drop points */}
                {odps.map((odp) => {
                  const parentOdc = odcs.find(o => o.id === odp.odcId);
                  if (!parentOdc) return null;

                  const odcCoord = getGlobalCoords(parentOdc.region, parentOdc.x, parentOdc.y);
                  const odpCoord = getGlobalCoords(parentOdc.region, odp.x, odp.y);
                  const isSelected = selectedOdpId === odp.id;
                  const distMtr = computeDistance(parentOdc.x, parentOdc.y, odp.x, odp.y);

                  return (
                    <g key={`cable-${odp.id}`} className="group cursor-pointer">
                      {/* Hit assist trigger area */}
                      <line
                        x1={odcCoord.x}
                        y1={odcCoord.y}
                        x2={odpCoord.x}
                        y2={odpCoord.y}
                        stroke="transparent"
                        strokeWidth="12"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOdpId(odp.id);
                          setSelectedOdcId(null);
                          setSelectedRegion(parentOdc.region);
                        }}
                      />

                      {/* Glowing neon backbone line path */}
                      <line
                        x1={odcCoord.x}
                        y1={odcCoord.y}
                        x2={odpCoord.x}
                        y2={odpCoord.y}
                        stroke={isSelected ? '#22d3ee' : '#047857'}
                        strokeOpacity={isSelected ? '0.9' : '0.45'}
                        strokeWidth={isSelected ? '2' : '1.5'}
                        strokeDasharray={odp.status === 'maintenance' ? '4,4' : undefined}
                        className="transition-all duration-300"
                      />

                      {/* Running laser white packets */}
                      {odp.status !== 'maintenance' && (
                        <line
                          x1={odcCoord.x}
                          y1={odcCoord.y}
                          x2={odpCoord.x}
                          y2={odpCoord.y}
                          stroke={isSelected ? '#22d3ee' : '#34d399'}
                          strokeWidth={isSelected ? '2.5' : '1.8'}
                          strokeDasharray="10, 30"
                          className="animate-dash-medium"
                          strokeOpacity="0.85"
                        />
                      )}

                      {/* Customer Drop branching lines */}
                      {odp.status !== 'maintenance' && [
                        { dx: -3.5, dy: 4 },
                        { dx: 4.5, dy: -2.5 },
                        { dx: 2, dy: 5 }
                      ].map((sub, sIdx) => {
                        const subX = odpCoord.x + (sub.dx * 3.5);
                        const subY = odpCoord.y + (sub.dy * 3.5);
                        return (
                          <g key={`sub-${odp.id}-${sIdx}`}>
                            <line
                              x1={odpCoord.x}
                              y1={odpCoord.y}
                              x2={subX}
                              y2={subY}
                              stroke="#f43f5e"
                              strokeWidth="0.8"
                              strokeOpacity="0.35"
                            />
                            <line
                              x1={odpCoord.x}
                              y1={odpCoord.y}
                              x2={subX}
                              y2={subY}
                              stroke="#fda4af"
                              strokeWidth="1"
                              strokeDasharray="2, 6"
                              className="animate-dash-slow"
                            />
                            <circle
                              cx={subX}
                              cy={subY}
                              r="2.2"
                              fill="#020617"
                              stroke="#fb7185"
                              strokeWidth="0.8"
                              className="transition-all duration-300 hover:scale-150 cursor-pointer"
                            />
                            <circle
                              cx={subX}
                              cy={subY}
                              r="0.8"
                              fill="#f43f5e"
                              className="animate-pulse"
                            />
                          </g>
                        );
                      })}

                      {/* Distance box popup label */}
                      {isSelected && (
                        <g>
                          <rect
                            x={(odcCoord.x + odpCoord.x) / 2 - 25}
                            y={(odcCoord.y + odpCoord.y) / 2 - 10}
                            width="50"
                            height="16"
                            rx="3"
                            fill="#020617"
                            stroke="#22d3ee"
                            strokeWidth="1"
                          />
                          <text
                            x={(odcCoord.x + odpCoord.x) / 2}
                            y={(odcCoord.y + odpCoord.y) / 2 + 1}
                            fill="#22d3ee"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {distMtr}m
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* ODC Cabinet Terminal boxes */}
                {odcs.map((odc) => {
                  const coord = getGlobalCoords(odc.region, odc.x, odc.y);
                  const isSelected = selectedOdcId === odc.id;

                  return (
                    <g
                      key={odc.id}
                      className="group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOdcId(odc.id);
                        setSelectedOdpId(null);
                        setSelectedRegion(odc.region);
                      }}
                    >
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isSelected ? '14' : '10'}
                        fill="#06b6d4"
                        fillOpacity="0.1"
                        className="animate-ping"
                        style={{ animationDuration: '4s' }}
                      />
                      <rect
                        x={coord.x - 7.5}
                        y={coord.y - 7.5}
                        width="15"
                        height="15"
                        rx="3"
                        fill="#020617"
                        stroke={isSelected ? '#22d3ee' : '#0891b2'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        className="transition-all duration-300"
                      />
                      <rect x={coord.x - 5} y={coord.y - 5} width="10" height="3" fill={odc.status === 'warning' ? '#f59e0b' : '#10b981'} />
                      <rect x={coord.x - 5} y={coord.y} width="10" height="3" fill="#3b82f6" />
                      <circle
                        cx={coord.x + 3.5}
                        cy={coord.y - 3.5}
                        r="1.2"
                        fill={odc.status === 'warning' ? '#f59e0b' : '#34d399'}
                      />
                      <text
                        x={coord.x}
                        y={coord.y + 14}
                        fill={isSelected ? '#22d3ee' : '#cbd5e1'}
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {odc.name.replace('ODC-', '')}
                      </text>
                    </g>
                  );
                })}

                {/* ODP Splitter Hexagon points */}
                {odps.map((odp) => {
                  const parentOdc = odcs.find(o => o.id === odp.odcId);
                  if (!parentOdc) return null;
                  
                  const coord = getGlobalCoords(parentOdc.region, odp.x, odp.y);
                  const isSelected = selectedOdpId === odp.id;
                  
                  // Hexagon coordinate points
                  const x = coord.x;
                  const y = coord.y;
                  const r = 5.5;
                  const points = `
                    ${x},${y - r}
                    ${x + r * 0.86},${y - r * 0.5}
                    ${x + r * 0.86},${y + r * 0.5}
                    ${x},${y + r}
                    ${x - r * 0.86},${y + r * 0.5}
                    ${x - r * 0.86},${y - r * 0.5}
                  `;

                  return (
                    <g
                      key={odp.id}
                      className="group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOdpId(odp.id);
                        setSelectedOdcId(null);
                        setSelectedRegion(parentOdc.region);
                      }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="transparent"
                      />
                      <polygon
                        points={points}
                        fill="#020617"
                        stroke={
                          isSelected 
                            ? '#22d3ee' 
                            : odp.status === 'full' 
                            ? '#f43f5e' 
                            : odp.status === 'maintenance' 
                            ? '#eab308' 
                            : '#10b981'
                        }
                        strokeWidth={isSelected ? '2.2' : '1.5'}
                        className="transition-all duration-300"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill={odp.status === 'full' ? '#ef4444' : '#10b981'}
                      />
                      <text
                        x={x}
                        y={y - 7.5}
                        fill={isSelected ? '#22d3ee' : '#94a3b8'}
                        fontSize="8.2"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {odp.name.substring(odp.name.lastIndexOf('-') + 1)}
                      </text>
                    </g>
                  );
                })}

                {/* Placement pointer guide when registering a node */}
                {isAddingNode !== 'none' && (
                  <g className="animate-pulse">
                    {(() => {
                      const coord = getGlobalCoords(selectedRegion, formX, formY);
                      return (
                        <>
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="18"
                            fill="none"
                            stroke={isAddingNode === 'odc' ? '#06b6d4' : '#10b981'}
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                          />
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="4"
                            fill={isAddingNode === 'odc' ? '#06b6d4' : '#10b981'}
                          />
                          <text
                            x={coord.x}
                            y={coord.y + 24}
                            fill={isAddingNode === 'odc' ? '#06b6d4' : '#10b981'}
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            KLIK DI SINI (X: {formX}% Y: {formY}%)
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}

              </g>
            </svg>

            {/* Float HUD coordinate selector help text */}
            {isAddingNode !== 'none' && (
              <div className="absolute top-16 left-3 right-3 bg-cyan-950/90 border border-cyan-400 p-2 rounded text-center text-[10px] font-mono text-cyan-200">
                INFO OPERATOR: Klik lokasi mana saja di dalam salah satu dari 6 sektor peta untuk mereferensikan koordinat {isAddingNode.toUpperCase()} baru Anda secara visual!
              </div>
            )}
          </div>

          {/* Quick Stats Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-950 p-3 border border-slate-900 rounded gap-3 text-center">
            <div>
              <span className="block text-[8px] font-mono text-slate-500 uppercase">ODC Kab Terpasang:</span>
              <span className="text-sm font-semibold text-cyan-400 font-orbitron">{activeOdcs.length} <span className="text-[10px] text-slate-400 font-sans">Skt</span> / {odcs.length} <span className="text-[10px] text-slate-400 font-sans">Glb</span></span>
            </div>
            <div>
              <span className="block text-[8px] font-mono text-slate-500 uppercase">ODP Splitter Active:</span>
              <span className="text-sm font-semibold text-emerald-400 font-orbitron">{activeOdps.length} <span className="text-[10px] text-slate-400 font-sans">Skt</span> / {odps.length} <span className="text-[10px] text-slate-400 font-sans">Glb</span></span>
            </div>
            <div>
              <span className="block text-[8px] font-mono text-slate-500 uppercase">Metro Fiber Backbone:</span>
              <span className="text-sm font-semibold text-purple-400 font-orbitron">100 G Ring</span>
            </div>
            <div>
              <span className="block text-[8px] font-mono text-slate-500 uppercase">Core SFP Terpakai:</span>
              <span className="text-sm font-semibold text-yellow-500 font-orbitron">
                {activeOdcs.reduce((acc, o) => acc + o.usedCore, 0)}/{activeOdcs.reduce((acc, o) => acc + o.totalCore, 0)} Core
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Node Settings or Editor form (agar user bisa atur sendiri) */}
        <div className="space-y-4">
          
          {/* 1. If currently "Form adding new node" mode is open */}
          {isAddingNode !== 'none' && (
            <NeonBox variant={isAddingNode === 'odc' ? 'cyan' : 'emerald'}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  + REGISTER {isAddingNode.toUpperCase()} BARU
                </span>
                <button
                  onClick={resetForm}
                  className="p-1 border border-slate-800 text-slate-500 hover:text-white rounded cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <form onSubmit={isAddingNode === 'odc' ? handleAddOdc : handleAddOdp} className="space-y-3 font-mono text-[11px]">
                
                {/* Coordinates preview */}
                <div className="p-2 bg-slate-950 border border-slate-900 rounded grid grid-cols-2 text-center text-slate-400">
                  <div>
                    <span className="block text-[8px] text-slate-550">X ( SECTOR )</span>
                    <strong className="text-cyan-400 text-xs">{formX}%</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-550">Y ( SECTOR )</span>
                    <strong className="text-cyan-400 text-xs">{formY}%</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Target Sektor Wilayah</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value as Region);
                      setFormName(`${isAddingNode.toUpperCase()}-${e.target.value.substring(e.target.value.lastIndexOf(' ') + 1, e.target.value.lastIndexOf(' ') + 4).toUpperCase()}-NEW`);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs px-2.5 py-1.5 rounded cursor-pointer uppercase font-bold"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>{r.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Nama / Kode Terminal</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 text-white font-bold"
                  />
                </div>

                {isAddingNode === 'odc' ? (
                  <>
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase mb-1">Alamat Penempatan</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jl. Jatimakmur Indah"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase mb-1">Kapasitas Core</label>
                        <select
                          value={formTotalCore}
                          onChange={(e) => setFormTotalCore(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-400 text-white cursor-pointer"
                        >
                          <option value={96}>96 Core</option>
                          <option value={144}>144 Core</option>
                          <option value={288}>288 Core</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase mb-1">Used Core (Awal)</label>
                        <input
                          type="number"
                          id="total-core-input"
                          min={0}
                          max={formTotalCore}
                          value={formUsedCore}
                          onChange={(e) => setFormUsedCore(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-cyan-400 text-white"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase mb-1">Pilih ODC Induk</label>
                        <select
                          value={formOdcId}
                          onChange={(e) => setFormOdcId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-400 text-white cursor-pointer"
                        >
                          {activeOdcs.length === 0 ? (
                            <option value="">-- TIDAK ADA ODC --</option>
                          ) : (
                            activeOdcs.map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase mb-1">Relasi Jalan</label>
                        <select
                          value={formStreetName}
                          onChange={(e) => setFormStreetName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-400 text-white cursor-pointer"
                        >
                          <option value="">-- PILIH JALAN --</option>
                          {activeStreets.map(st => (
                            <option key={st.id} value={st.name}>{st.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase mb-1">Ratio Splitter</label>
                        <select
                          value={formSplitter}
                          onChange={(e) => setFormSplitter(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white cursor-pointer"
                        >
                          <option value="1:8">1:8 Splitter</option>
                          <option value="1:16">1:16 Splitter</option>
                          <option value="1:32">1:32 Splitter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase mb-1">Occupied Ports</label>
                        <input
                          type="number"
                          id="form-occupied-ports"
                          min={0}
                          max={formSplitter === '1:8' ? 8 : formSplitter === '1:16' ? 16 : 32}
                          value={formUsedPorts}
                          onChange={(e) => setFormUsedPorts(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold uppercase transition-all tracking-wider text-[10px] rounded cursor-pointer"
                  >
                    Simpan Node
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </NeonBox>
          )}

          {/* 2. In default view, if selected ODC is Active */}
          {selectedOdcId && currentOdc && isAddingNode === 'none' && (
            <NeonBox variant="cyan">
              <div className="flex justify-between items-center border-b border-cyan-400/20 pb-2 mb-3">
                <div className="flex items-center gap-1">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">
                    ODC CABINET HUD
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOdcId(null)}
                  className="p-1 border border-slate-850 hover:border-cyan-400 text-slate-500 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-[11px] text-slate-300">
                <div className="bg-slate-950 p-2.5 border border-slate-900 rounded">
                  <span className="block text-[8px] text-slate-500 uppercase">Cabinet Identity:</span>
                  <strong className="text-sm text-cyan-400 block mt-1 tracking-wider">{currentOdc.name}</strong>
                  <span className="text-[10px] text-slate-300 block mt-1">{currentOdc.address}</span>
                  <span className="text-[9px] text-emerald-400 block mt-1">📍 SEKTOR: {currentOdc.region.toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded">
                    <span className="block text-[8px] text-slate-550">TOTAL CORE</span>
                    <span className="text-xs font-bold text-slate-300">{currentOdc.totalCore} Core</span>
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded">
                    <span className="block text-[8px] text-slate-550">USED FIBER</span>
                    <span className="text-xs font-bold text-amber-400">{currentOdc.usedCore} Core</span>
                  </div>
                </div>

                {/* Core availability progress bar */}
                <div className="bg-black/40 p-2 rounded border border-slate-900">
                  <div className="flex justify-between text-[9px] mb-1 text-slate-550">
                    <span>PORT PENERIMAAN SFP:</span>
                    <span className="text-slate-300 font-bold">{Math.round((currentOdc.usedCore / currentOdc.totalCore) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-amber-500"
                      style={{ width: `${(currentOdc.usedCore / currentOdc.totalCore) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex gap-2">
                  <button
                    onClick={() => removeOdc(currentOdc.id)}
                    className="w-full py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white uppercase transition-colors text-[9px] font-bold rounded cursor-pointer inline-flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    DECOMMISSION ODC
                  </button>
                </div>
              </div>
            </NeonBox>
          )}

          {/* 3. If selected ODP Splitter Node is Active */}
          {selectedOdpId && currentOdp && isAddingNode === 'none' && (
            <NeonBox variant={currentOdp.status === 'full' ? 'red' : currentOdp.status === 'maintenance' ? 'amber' : 'emerald'}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                    ODP SPLITTER HUD
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOdpId(null)}
                  className="p-1 border border-slate-850 hover:border-emerald-400 text-slate-500 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Dynamic info box */}
              <div className="space-y-3 font-mono text-[11px] text-slate-300">
                <div className="bg-slate-950 p-2.5 border border-slate-900 rounded">
                  <div className="flex justify-between">
                    <span className="block text-[8px] text-slate-500 uppercase">Terminal Splitter:</span>
                    <span className={`px-1 rounded text-[8px] font-black uppercase ${
                      currentOdp.status === 'full' 
                        ? 'bg-red-950 text-red-400 border border-red-500/35' 
                        : currentOdp.status === 'maintenance' 
                        ? 'bg-amber-955 text-amber-400 border border-amber-500/35' 
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/35'
                    }`}>
                      {currentOdp.status}
                    </span>
                  </div>
                  <strong className="text-xs text-white block mt-1 tracking-wider">{currentOdp.name}</strong>
                  <span className="text-[10px] text-cyan-400 font-bold block mt-1 flex items-center gap-1">
                    📍 {currentOdp.streetName}
                  </span>
                </div>

                {/* Optical power budget measurement */}
                <div className="bg-slate-950 p-2.5 border border-slate-900 rounded space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">ATTENUATION BUDGET:</span>
                    <span className={`font-bold ${currentOdp.opticalLoss >= 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                      -{currentOdp.opticalLoss} dBm
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">RELASI KONEKSI ODC:</span>
                    <span className="text-cyan-400 font-bold">{currentOdp.odcId.replace('ODC-', '')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded">
                    <span className="block text-[8px] text-slate-550 uppercase">RATIO MODEL</span>
                    <span className="text-xs font-bold text-slate-300">{currentOdp.splitterRatio} PLC</span>
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded">
                    <span className="block text-[8px] text-slate-550 uppercase">OCCUPIED</span>
                    <span className="text-xs font-bold text-yellow-500">
                      {currentOdp.usedPorts} / {currentOdp.splitterRatio === '1:8' ? 8 : currentOdp.splitterRatio === '1:16' ? 16 : 32} Port
                    </span>
                  </div>
                </div>

                {/* Subscribed customers mapped under this ODP */}
                <div className="bg-slate-950/60 p-2 rounded border border-slate-900 max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                  <span className="block text-[8px] text-slate-550 font-bold uppercase mb-1">// PELANGGAN TERHUBUNG JALUR:</span>
                  
                  {customers.filter(c => c.region === selectedRegion && c.address && currentOdp?.streetName && c.address.toLowerCase().includes(currentOdp.streetName.toLowerCase())).length === 0 ? (
                    <p className="text-[10px] text-slate-600 text-center uppercase font-bold py-2">
                      Belum ada pelanggan ditarik ke ODP ini.
                    </p>
                  ) : (
                    customers
                      .filter(c => c.region === selectedRegion && c.address && currentOdp?.streetName && c.address.toLowerCase().includes(currentOdp.streetName.toLowerCase()))
                      .map(c => (
                        <div key={c.id} className="bg-slate-950 p-1.5 border border-white/5 rounded flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-200 block font-bold truncate max-w-[130px]">{c.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono italic block">{c.pppoeUsername}</span>
                          </div>
                          
                          <span className={`text-[8px] font-black px-1 rounded ${
                            c.status === 'online' 
                              ? 'bg-emerald-950 text-emerald-400' 
                              : 'bg-red-953 text-red-400'
                          }`}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                  )}
                </div>

                <div className="border-t border-white/5 pt-3 flex gap-2">
                  <button
                    onClick={() => removeOdp(currentOdp.id)}
                    className="w-full py-1.5 bg-red-955/40 hover:bg-red-900 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white uppercase transition-colors text-[9px] font-bold rounded cursor-pointer inline-flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    DECOMMISSION ODP
                  </button>
                </div>
              </div>
            </NeonBox>
          )}

          {/* 4. Help manual checklist block */}
          {!selectedOdcId && !selectedOdpId && isAddingNode === 'none' && (
            <NeonBox variant="cyan">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-3">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">
                  TACTICAL NOC CONTROLS
                </span>
              </div>

              <div className="space-y-2 text-[10.5px] font-mono leading-normal text-slate-400">
                <p>
                  Sistem visualisator fiber-optic ini memetakan link fisik infrastruktur GPON OLT Aisyaka secara real-time:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500">
                  <li><strong className="text-cyan-400">Pilih ODC / ODP</strong> pada peta untuk melihat spesifikasi detail, core atenuasi dBm, sfp splitter model PLC, dan daftar nama pelanggan terintegrasi.</li>
                  <li>Amati <strong className="text-emerald-400">garis laser berdenyut</strong> yang mewakili rute kabel drop-core dari pusat ODC ke ODP pembagi jalan.</li>
                  <li>Gunakan tombol <strong className="text-white bg-slate-900 px-1">+ ODC Induk</strong> atau <strong className="text-white bg-slate-900 px-1">+ ODP Splitter</strong> di atas kanan peta untuk memasang atau bereksperimen dengan koordinat baru.</li>
                </ul>
              </div>
            </NeonBox>
          )}

          {/* 5. Fiber Path Legend (Pojok Kanan Bawah) */}
          <NeonBox variant="cyan">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">
                // LEGENDA JALUR FIBER
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-mono uppercase">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-rose-500 border border-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.8)] rounded-sm" />
                <span className="text-slate-300">NOC Core Central</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-purple-500 border border-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.8)] rounded-sm" />
                <span className="text-slate-300">OLT Sektor Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-cyan-400 border border-cyan-300 shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
                <span className="text-slate-300">ODC Induk Cab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-400 rotate-45 border border-emerald-300 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                <span className="text-slate-300">ODP Splitter Box</span>
              </div>
              <div className="col-span-2 border-t border-white/5 my-1" />
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-6 h-0.5 bg-purple-500/80 border-t border-purple-300" />
                <span className="text-slate-400 text-[9px]">Backhaul OLT Ring (Heavy Pulse)</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-6 h-0.5 bg-cyan-500/80 border-t border-cyan-300 border-dashed" />
                <span className="text-slate-400 text-[9px]">Kabel Feeder ODC (Fast Pulse)</span>
              </div>
            </div>
          </NeonBox>

        </div>
      </div>

    </div>
  );
}

