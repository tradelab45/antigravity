import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Search, 
  Play, 
  Copy, 
  Check, 
  Layers, 
  Building2, 
  ShieldCheck, 
  Briefcase, 
  TrendingUp, 
  Filter, 
  RefreshCw, 
  Code2, 
  Table as TableIcon, 
  Share2, 
  Cpu, 
  ChevronRight,
  Info,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export interface GraphNode {
  id: string;
  name: string;
  ticker?: string;
  type: 'Conglomerate' | 'Listed Company' | 'Regulator' | 'Institutional Fund';
  group?: string;
  sector?: string;
  marketCapCr?: number;
  aumCr?: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  description: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'OWNS_STAKE' | 'SUPPLIES' | 'REGULATES' | 'INSTITUTIONAL_HOLDING';
  label: string;
  detail: string;
  weight?: number; // e.g., percentage or value
}

// Canonical Indian Market Corporate Ecosystem Graph Dataset
const GRAPH_NODES: GraphNode[] = [
  // Conglomerates / Holding Entities
  { id: 'TATA_SONS', name: 'Tata Sons Pvt Ltd', type: 'Conglomerate', group: 'Tata Group', marketCapCr: 3200000, x: 260, y: 160, radius: 26, color: '#6366f1', description: 'Principal investment holding company and promoter of Tata operating companies.' },
  { id: 'RELIANCE_IND', name: 'Reliance Industries', ticker: 'RELIANCE', type: 'Conglomerate', group: 'Reliance Group', sector: 'Energy & Tech', marketCapCr: 2025000, x: 740, y: 150, radius: 26, color: '#8b5cf6', description: 'India’s largest conglomerate spanning petrochemicals, telecommunications (Jio), and retail.' },
  { id: 'ADANI_ENT', name: 'Adani Enterprises', ticker: 'ADANIENT', type: 'Conglomerate', group: 'Adani Group', sector: 'Infrastructure', marketCapCr: 345000, x: 500, y: 390, radius: 24, color: '#ec4899', description: 'Incubator for Adani Group’s infrastructure, energy, airports, and data center ventures.' },
  { id: 'GOI', name: 'Government of India (DIPAM)', type: 'Conglomerate', group: 'PSU / Sovereign', marketCapCr: 4500000, x: 500, y: 70, radius: 26, color: '#f59e0b', description: 'Sovereign ownership authority governing Maharatna and Navratna public enterprises.' },

  // Listed Operating Companies - Tata
  { id: 'TCS', name: 'Tata Consultancy Services', ticker: 'TCS', type: 'Listed Company', group: 'Tata Group', sector: 'Information Technology', marketCapCr: 1450000, x: 140, y: 270, radius: 21, color: '#10b981', description: 'Global leader in IT consulting and digital transformation solutions.' },
  { id: 'TATAMOTORS', name: 'Tata Motors Passenger & CV', ticker: 'TATAMOTORS', type: 'Listed Company', group: 'Tata Group', sector: 'Automobile', marketCapCr: 365000, x: 260, y: 320, radius: 20, color: '#06b6d4', description: 'Leading Indian automotive maker with Jaguar Land Rover and pioneer EV dominance.' },
  { id: 'TATAPOWER', name: 'Tata Power', ticker: 'TATAPOWER', type: 'Listed Company', group: 'Tata Group', sector: 'Utilities & Solar', marketCapCr: 135000, x: 380, y: 250, radius: 18, color: '#14b8a6', description: 'Integrated renewable and transmission power generation enterprise.' },

  // Listed Operating Companies - Reliance
  { id: 'JIO_FIN', name: 'Jio Financial Services', ticker: 'JIOFIN', type: 'Listed Company', group: 'Reliance Group', sector: 'Financial Services', marketCapCr: 215000, x: 860, y: 260, radius: 19, color: '#3b82f6', description: 'Demerged fintech arm powering retail credit, digital payments, and asset management.' },
  { id: 'RELIANCE_RETAIL', name: 'Reliance Retail Ventures', type: 'Listed Company', group: 'Reliance Group', sector: 'Consumer Retail', marketCapCr: 850000, x: 740, y: 300, radius: 21, color: '#2563eb', description: 'India’s largest omnichannel retailer with over 18,000 stores nationwide.' },

  // Listed Operating Companies - Adani
  { id: 'ADANI_PORTS', name: 'Adani Ports & SEZ', ticker: 'ADANIPORTS', type: 'Listed Company', group: 'Adani Group', sector: 'Logistics & Ports', marketCapCr: 310000, x: 400, y: 490, radius: 20, color: '#f43f5e', description: 'India’s largest commercial port operator handling over 25% of the country’s maritime cargo.' },
  { id: 'ADANI_GREEN', name: 'Adani Green Energy', ticker: 'ADANIGREEN', type: 'Listed Company', group: 'Adani Group', sector: 'Clean Energy', marketCapCr: 280000, x: 600, y: 490, radius: 19, color: '#10b981', description: 'Renewable power developer with Asia’s largest single-location solar-wind park in Khavda.' },

  // Sovereign / PSU Entities
  { id: 'SBI', name: 'State Bank of India', ticker: 'SBIN', type: 'Listed Company', group: 'PSU / Sovereign', sector: 'Banking', marketCapCr: 720000, x: 360, y: 110, radius: 22, color: '#0ea5e9', description: 'Fortune 500 state-owned banking behemoth servicing over 480 million customers.' },
  { id: 'COALINDIA', name: 'Coal India Ltd', ticker: 'COALINDIA', type: 'Listed Company', group: 'PSU / Sovereign', sector: 'Mining & Resources', marketCapCr: 295000, x: 640, y: 90, radius: 19, color: '#d97706', description: 'Maharatna mining giant producing ~80% of India’s domestic coal fuel.' },

  // Regulators & Institutional Investors
  { id: 'SEBI', name: 'Securities and Exchange Board of India', type: 'Regulator', marketCapCr: 0, x: 500, y: 220, radius: 24, color: '#e11d48', description: 'Apex statutory securities market regulator safeguarding investor protection.' },
  { id: 'LIC_INDIA', name: 'Life Insurance Corp of India', ticker: 'LICI', type: 'Institutional Fund', aumCr: 5200000, x: 500, y: 310, radius: 24, color: '#3b82f6', description: 'India’s largest domestic institutional investor (DII) with equity holdings across all Nifty 50.' },
];

const GRAPH_EDGES: GraphEdge[] = [
  // Tata Sons holdings
  { id: 'e1', source: 'TATA_SONS', target: 'TCS', type: 'OWNS_STAKE', label: '72.3% Promoter Stake', detail: 'Tata Sons holds controlling promoter interest in TCS', weight: 72.3 },
  { id: 'e2', source: 'TATA_SONS', target: 'TATAMOTORS', type: 'OWNS_STAKE', label: '46.4% Promoter Stake', detail: 'Primary promoter equity holding', weight: 46.4 },
  { id: 'e3', source: 'TATA_SONS', target: 'TATAPOWER', type: 'OWNS_STAKE', label: '46.8% Promoter Stake', detail: 'Strategic utility investment', weight: 46.8 },

  // Inter-Tata Supply Chain
  { id: 'e4', source: 'TATAPOWER', target: 'TATAMOTORS', type: 'SUPPLIES', label: 'EV Charging Grid Infra', detail: 'Tata Power installs nationwide fast-charging network for Tata EV fleet', weight: 85.0 },
  { id: 'e5', source: 'TCS', target: 'TATAMOTORS', type: 'SUPPLIES', label: 'Automotive Software & Telematics', detail: 'TCS engineers ADAS software and connected vehicle telemetry', weight: 70.0 },

  // Reliance Ecosystem
  { id: 'e6', source: 'RELIANCE_IND', target: 'JIO_FIN', type: 'OWNS_STAKE', label: '46.8% Promoter Holding', detail: 'Demerged financial services arm retaining strategic parent backing', weight: 46.8 },
  { id: 'e7', source: 'RELIANCE_IND', target: 'RELIANCE_RETAIL', type: 'OWNS_STAKE', label: '83.6% Subsidiary Stake', detail: 'Direct subsidiary consumer retail engine', weight: 83.6 },
  { id: 'e8', source: 'RELIANCE_RETAIL', target: 'JIO_FIN', type: 'SUPPLIES', label: 'PoS Merchant Ecosystem', detail: 'Digital payments and buy-now-pay-later integrations at 18,000+ stores', weight: 90.0 },

  // Adani Ecosystem
  { id: 'e9', source: 'ADANI_ENT', target: 'ADANI_PORTS', type: 'OWNS_STAKE', label: '65.9% Promoter Stake', detail: 'Promoter family and holding vehicle majority control', weight: 65.9 },
  { id: 'e10', source: 'ADANI_ENT', target: 'ADANI_GREEN', type: 'OWNS_STAKE', label: '56.3% Controlling Stake', detail: 'Renewable capacity execution cluster', weight: 56.3 },
  { id: 'e11', source: 'ADANI_PORTS', target: 'COALINDIA', type: 'SUPPLIES', label: 'Evacuation & Coastal Shipping', detail: 'Exclusive coal handling berths and railway freight corridors', weight: 65.0 },

  // Sovereign Ownership
  { id: 'e12', source: 'GOI', target: 'SBI', type: 'OWNS_STAKE', label: '57.5% Sovereign Stake', detail: 'Majority controlling stake in largest public sector bank', weight: 57.5 },
  { id: 'e13', source: 'GOI', target: 'COALINDIA', type: 'OWNS_STAKE', label: '63.1% Maharatna Stake', detail: 'Sovereign majority controlling stake', weight: 63.1 },

  // Institutional & Regulatory Connections
  { id: 'e14', source: 'LIC_INDIA', target: 'RELIANCE_IND', type: 'INSTITUTIONAL_HOLDING', label: '6.2% DII Stake', detail: 'Largest single domestic institutional holder in Reliance', weight: 6.2 },
  { id: 'e15', source: 'LIC_INDIA', target: 'TCS', type: 'INSTITUTIONAL_HOLDING', label: '4.8% DII Stake', detail: 'Substantial long-term equity allocation', weight: 4.8 },
  { id: 'e16', source: 'LIC_INDIA', target: 'SBI', type: 'INSTITUTIONAL_HOLDING', label: '8.9% Institutional Stake', detail: 'Core anchor institutional holding', weight: 8.9 },
  { id: 'e17', source: 'SEBI', target: 'TCS', type: 'REGULATES', label: 'LODR Compliance Mandate', detail: 'Listing Obligations and Disclosure Requirements oversight', weight: 100.0 },
  { id: 'e18', source: 'SEBI', target: 'RELIANCE_IND', type: 'REGULATES', label: 'LODR & Takeover Code', detail: 'Regulatory oversight for equity disclosures', weight: 100.0 },
];

interface GqlQueryTemplate {
  id: string;
  title: string;
  tag: string;
  description: string;
  query: string;
  sampleOutput: Array<Record<string, string | number>>;
}

const GQL_QUERY_TEMPLATES: GqlQueryTemplate[] = [
  {
    id: 'conglomerate-topology',
    title: 'Conglomerate Multi-Tier Ownership Topology',
    tag: 'Standalone GQL',
    description: 'Matches conglomerate promoter nodes and their directly owned operating companies with JSON serialization for UI graphing.',
    query: `GRAPH IndianCapitalMarkets.CorporateEcosystem.NiftyEcosystemGraph
MATCH p = (c:Conglomerate)-[r:OWNS_STAKE]->(co:Company)
WHERE r.stake_percent >= 40.0
RETURN
    TO_JSON(c) AS conglomerate_node,
    TO_JSON(r) AS stake_relationship,
    TO_JSON(co) AS subsidiary_node,
    TO_JSON(p) AS full_path
LIMIT 500`,
    sampleOutput: [
      { conglomerate: 'Tata Sons Pvt Ltd', subsidiary: 'Tata Consultancy Services', stake_percent: '72.3%', path_hops: 1 },
      { conglomerate: 'Tata Sons Pvt Ltd', subsidiary: 'Tata Motors Ltd', stake_percent: '46.4%', path_hops: 1 },
      { conglomerate: 'Tata Sons Pvt Ltd', subsidiary: 'Tata Power Ltd', stake_percent: '46.8%', path_hops: 1 },
      { conglomerate: 'Reliance Industries', subsidiary: 'Reliance Retail Ventures', stake_percent: '83.6%', path_hops: 1 },
      { conglomerate: 'Adani Enterprises', subsidiary: 'Adani Ports & SEZ', stake_percent: '65.9%', path_hops: 1 },
    ]
  },
  {
    id: 'shortest-path',
    title: 'Shortest Path Dependency Traversal',
    tag: 'Path Functions',
    description: 'Uses ISO GQL ANY SHORTEST path matching with variable hops {1,3} to uncover vendor supply chain dependencies.',
    query: `GRAPH IndianCapitalMarkets.CorporateEcosystem.NiftyEcosystemGraph
MATCH ANY SHORTEST p = (src:Company {ticker: "TATAMOTORS"})-[e:SUPPLIES|OWNS_STAKE]->{1,3}(dst:Company)
RETURN
    PATH_FIRST(p).ticker AS origin_ticker,
    PATH_LAST(p).ticker AS target_ticker,
    PATH_LENGTH(p) AS hops,
    TO_JSON(NODES(p)) AS intermediate_nodes`,
    sampleOutput: [
      { origin_ticker: 'TATAMOTORS', target_ticker: 'TCS', hops: 2, relationship_chain: 'TATAMOTORS <- [OWNS_STAKE] - TATA_SONS - [OWNS_STAKE] -> TCS' },
      { origin_ticker: 'TATAMOTORS', target_ticker: 'TATAPOWER', hops: 1, relationship_chain: 'TATAPOWER - [SUPPLIES] -> TATAMOTORS (EV Grid)' },
    ]
  },
  {
    id: 'graph-table-aggregation',
    title: 'Relational Aggregation with GRAPH_TABLE',
    tag: 'GRAPH_TABLE TVF',
    description: 'Bridges graph pattern matching with standard BigQuery GoogleSQL aggregation and market capitalization summation.',
    query: `SELECT
  conglomerate_name,
  COUNT(DISTINCT company_id) AS companies_controlled,
  SUM(market_cap_cr) AS total_ecosystem_market_cap_cr
FROM GRAPH_TABLE(
  IndianCapitalMarkets.CorporateEcosystem.NiftyEcosystemGraph
  MATCH (cg:Conglomerate)-[st:OWNS_STAKE]->(cp:Company)
  COLUMNS (
    cg.name AS conglomerate_name,
    cp.id AS company_id,
    cp.market_cap_cr AS market_cap_cr
  )
)
GROUP BY conglomerate_name
ORDER BY total_ecosystem_market_cap_cr DESC`,
    sampleOutput: [
      { conglomerate_name: 'Tata Sons Pvt Ltd', companies_controlled: 3, total_ecosystem_market_cap_cr: '₹19,50,000 Cr' },
      { conglomerate_name: 'Reliance Industries', companies_controlled: 2, total_ecosystem_market_cap_cr: '₹10,65,000 Cr' },
      { conglomerate_name: 'Government of India', companies_controlled: 2, total_ecosystem_market_cap_cr: '₹10,15,000 Cr' },
      { conglomerate_name: 'Adani Enterprises', companies_controlled: 2, total_ecosystem_market_cap_cr: '₹5,90,000 Cr' },
    ]
  }
];

export const BigQueryGraphView: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('TATA_SONS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'VISUALIZER' | 'QUERY_STUDIO' | 'DATA_TABLE'>('VISUALIZER');
  
  // GQL Query Studio State
  const [selectedQueryId, setSelectedQueryId] = useState<string>(GQL_QUERY_TEMPLATES[0].id);
  const [activeQueryText, setActiveQueryText] = useState<string>(GQL_QUERY_TEMPLATES[0].query);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedQuery, setCopiedQuery] = useState<boolean>(false);
  const [queryExecutionStats, setQueryExecutionStats] = useState<{
    bytesProcessed: string;
    executionTimeMs: number;
    rowsReturned: number;
  } | null>({
    bytesProcessed: '4.82 MB',
    executionTimeMs: 114,
    rowsReturned: 5
  });

  const activeTemplate = useMemo(() => {
    return GQL_QUERY_TEMPLATES.find(q => q.id === selectedQueryId) || GQL_QUERY_TEMPLATES[0];
  }, [selectedQueryId]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return GRAPH_NODES.filter(node => {
      const matchesGroup = selectedGroup === 'ALL' || node.group === selectedGroup || (selectedGroup === 'REGULATOR' && node.type === 'Regulator');
      const matchesSearch = !searchQuery || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (node.ticker && node.ticker.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (node.sector && node.sector.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // Filter edges
  const filteredEdges = useMemo(() => {
    return GRAPH_EDGES.filter(edge => {
      const connectsActiveNodes = activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target);
      const matchesType = selectedEdgeType === 'ALL' || edge.type === selectedEdgeType;
      return connectsActiveNodes && matchesType;
    });
  }, [activeNodeIds, selectedEdgeType]);

  const selectedNode = useMemo(() => {
    return GRAPH_NODES.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  // Find incoming and outgoing edges for selected node
  const selectedNodeRelationships = useMemo(() => {
    if (!selectedNodeId) return { inbound: [], outbound: [] };
    const outbound = GRAPH_EDGES.filter(e => e.source === selectedNodeId);
    const inbound = GRAPH_EDGES.filter(e => e.target === selectedNodeId);
    return { inbound, outbound };
  }, [selectedNodeId]);

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(activeQueryText);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleRunQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setQueryExecutionStats({
        bytesProcessed: `${(Math.random() * 3 + 2.5).toFixed(2)} MB`,
        executionTimeMs: Math.floor(Math.random() * 80 + 95),
        rowsReturned: activeTemplate.sampleOutput.length
      });
    }, 450);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in" role="region" aria-label="BigQuery Graph Analytics Workspace">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Network size={13} className="text-indigo-600 dark:text-indigo-400" />
              BigQuery Graph Engine • ISO GQL Standard
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              IndianCapitalMarkets.CorporateEcosystem
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Market Corporate Ecosystem & Topology Graph
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-3xl">
            Analyze conglomerate cross-holdings, supply-chain vendor dependencies, and institutional DII ownership networks using GoogleSQL Graph Analytics (GQL).
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start md:self-auto" role="tablist" aria-label="Graph View Modes">
          <button
            role="tab"
            aria-selected={activeTab === 'VISUALIZER'}
            onClick={() => setActiveTab('VISUALIZER')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none ${
              activeTab === 'VISUALIZER'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Share2 size={14} />
            Visual Canvas
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'QUERY_STUDIO'}
            onClick={() => setActiveTab('QUERY_STUDIO')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none ${
              activeTab === 'QUERY_STUDIO'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Code2 size={14} />
            GQL Query Studio
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'DATA_TABLE'}
            onClick={() => setActiveTab('DATA_TABLE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none ${
              activeTab === 'DATA_TABLE'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <TableIcon size={14} />
            Edge Registry
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Row (Building Data Apps Standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Graph Entities</span>
            <Building2 size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              {GRAPH_NODES.length}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">4 Vertex Labels</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Conglomerates, Equities, DIIs, Regulators
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Direct Topological Edges</span>
            <Share2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              {GRAPH_EDGES.length}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Directed ISO Edges</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Ownership, supply chains & oversight
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Ecosystem Cap</span>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              ₹98.4L Cr
            </span>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">~42% of Nifty</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Combined market valuation analyzed
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Max Traversal Hops</span>
            <Cpu size={16} className="text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              3 Hops
            </span>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">O(k) Path Complexity</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Zero cycle lock in BigQuery engine
          </div>
        </div>
      </div>

      {/* View Mode 1: Interactive Visual Canvas */}
      {activeTab === 'VISUALIZER' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Filter size={13} /> Filter Cluster:
              </span>
              {(['ALL', 'Tata Group', 'Reliance Group', 'Adani Group', 'PSU / Sovereign'] as const).map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none ${
                    selectedGroup === group
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-xs w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="graph-search-input"
                name="graph-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entity, ticker, sector..."
                aria-label="Filter graph nodes"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Canvas & Sidebar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Interactive SVG Network Graph Canvas */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[520px]">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Live Directed Property Graph ({filteredNodes.length} Vertices • {filteredEdges.length} Edges)
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  Click any node to focus topology & GQL bindings
                </div>
              </div>

              {/* The SVG Visualization Engine */}
              <div className="w-full flex-1 flex items-center justify-center py-2">
                <svg
                  viewBox="0 0 1000 580"
                  className="w-full h-auto max-h-[500px] select-none"
                  aria-label="Interactive corporate ecosystem network graph"
                >
                  <defs>
                    {/* Arrowhead marker for directed edges */}
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="18"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                    <marker
                      id="arrowhead-active"
                      markerWidth="10"
                      markerHeight="7"
                      refX="18"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                    </marker>
                  </defs>

                  {/* Render Edges */}
                  {filteredEdges.map(edge => {
                    const sourceNode = GRAPH_NODES.find(n => n.id === edge.source);
                    const targetNode = GRAPH_NODES.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const isConnectedToSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;
                    const strokeColor = isConnectedToSelected ? '#6366f1' : '#cbd5e1';
                    const strokeWidth = isConnectedToSelected ? 2.5 : 1.2;
                    const strokeOpacity = selectedNodeId ? (isConnectedToSelected ? 1 : 0.25) : 0.6;
                    const marker = isConnectedToSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)';

                    return (
                      <g key={edge.id} className="transition-all duration-200">
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeOpacity={strokeOpacity}
                          strokeDasharray={edge.type === 'SUPPLIES' ? '4 3' : undefined}
                          markerEnd={marker}
                        />
                        {/* Edge Label Pill if active */}
                        {isConnectedToSelected && (
                          <text
                            x={(sourceNode.x + targetNode.x) / 2}
                            y={(sourceNode.y + targetNode.y) / 2 - 6}
                            fill="#6366f1"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none bg-white dark:bg-zinc-900"
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Render Nodes */}
                  {filteredNodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const isRelated = selectedNodeRelationships.inbound.some(e => e.source === node.id) ||
                                      selectedNodeRelationships.outbound.some(e => e.target === node.id);
                    const isDimmed = selectedNodeId && !isSelected && !isRelated;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setSelectedNodeId(node.id)}
                        className="cursor-pointer transition-all duration-200"
                        tabIndex={0}
                        role="button"
                        aria-label={`Select ${node.name} (${node.type})`}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedNodeId(node.id);
                          }
                        }}
                      >
                        {/* Glow for selected node */}
                        {isSelected && (
                          <circle
                            r={node.radius + 7}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3"
                            strokeOpacity="0.4"
                            className="animate-pulse"
                          />
                        )}

                        {/* Base Node Circle */}
                        <circle
                          r={node.radius}
                          fill={node.color}
                          opacity={isDimmed ? 0.35 : 1}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="shadow-md"
                        />

                        {/* Node Label Text */}
                        <text
                          y={node.radius + 14}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={isSelected ? 'bold' : '600'}
                          fill={isSelected ? '#4f46e5' : '#475569'}
                          opacity={isDimmed ? 0.4 : 1}
                          className="dark:fill-zinc-200 pointer-events-none"
                        >
                          {node.ticker || node.name.split(' ')[0]}
                        </text>

                        {/* Entity Sub-badge */}
                        {isSelected && (
                          <text
                            y={node.radius + 26}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#6366f1"
                            className="pointer-events-none"
                          >
                            :{node.type.toUpperCase().replace(' ', '_')}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Canvas Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Conglomerate</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Listed Company</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Regulator</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Institutional DII</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-400 inline-block" /> OWNS_STAKE</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 border-t border-dashed border-slate-500 inline-block" /> SUPPLIES</span>
                </div>
              </div>
            </div>

            {/* Selected Entity Drilldown Inspector Panel */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-1">
                        :{selectedNode.type}
                      </span>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {selectedNode.name}
                      </h2>
                      {selectedNode.ticker && (
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          NSE: {selectedNode.ticker}
                        </span>
                      )}
                    </div>
                    {selectedNode.group && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {selectedNode.group}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {selectedNode.description}
                  </p>

                  {/* Financial / Market Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Valuation / AUM</div>
                      <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {selectedNode.marketCapCr ? `₹${(selectedNode.marketCapCr / 1000).toFixed(1)}k Cr` : selectedNode.aumCr ? `₹${(selectedNode.aumCr / 1000).toFixed(1)}k Cr AUM` : 'Statutory'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Primary Sector</div>
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {selectedNode.sector || 'Conglomerate Holding'}
                      </div>
                    </div>
                  </div>

                  {/* Connected Relationships */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Connected Relationships ({selectedNodeRelationships.outbound.length + selectedNodeRelationships.inbound.length})
                    </h3>

                    {/* Outbound */}
                    {selectedNodeRelationships.outbound.map(edge => {
                      const target = GRAPH_NODES.find(n => n.id === edge.target);
                      return (
                        <div key={edge.id} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-semibold mb-0.5">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              -[{edge.type}]-&gt;
                            </span>
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                              {target?.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            {edge.detail}
                          </div>
                        </div>
                      );
                    })}

                    {/* Inbound */}
                    {selectedNodeRelationships.inbound.map(edge => {
                      const source = GRAPH_NODES.find(n => n.id === edge.source);
                      return (
                        <div key={edge.id} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              &lt;-[{edge.type}]-
                            </span>
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                              {source?.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            {edge.detail}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  Select any node in the graph to inspect its properties and connected edges.
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                <button
                  onClick={() => {
                    setActiveTab('QUERY_STUDIO');
                    if (selectedNode) {
                      setActiveQueryText(
                        `GRAPH IndianCapitalMarkets.CorporateEcosystem.NiftyEcosystemGraph\nMATCH (n {id: "${selectedNode.id}"})-[e]-(target)\nRETURN n.name AS origin, LABELS(e)[OFFSET(0)] AS relation, target.name AS connected_entity\nLIMIT 50`
                      );
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
                >
                  <Code2 size={14} />
                  Open in GQL Query Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 2: GQL Query Studio */}
      {activeTab === 'QUERY_STUDIO' && (
        <div className="space-y-4">
          {/* Query Templates Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GQL_QUERY_TEMPLATES.map(template => {
              const isSelected = selectedQueryId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedQueryId(template.id);
                    setActiveQueryText(template.query);
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {template.tag}
                    </span>
                    {isSelected && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Active</span>}
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {template.title}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {template.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive GQL Editor Box */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Code2 size={15} className="text-indigo-500" />
                <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  BigQuery GoogleSQL GQL Editor
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  (ISO/IEC 39075 GQL compliant)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyQuery}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Copy GQL Query"
                >
                  {copiedQuery ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copiedQuery ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRunQuery}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isExecuting ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* Code Textarea with Mono Font */}
            <div className="p-4 bg-zinc-950 font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto">
              <textarea
                id="graph-gql-code-editor"
                name="graph-gql-code-editor"
                value={activeQueryText}
                onChange={e => setActiveQueryText(e.target.value)}
                rows={7}
                aria-label="BigQuery GQL code input"
                className="w-full bg-transparent text-emerald-300 outline-none resize-none font-mono text-xs leading-5 border-none focus:ring-0"
                spellCheck={false}
              />
            </div>

            {/* Query Engine Execution Telemetry */}
            {queryExecutionStats && (
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-4">
                  <span>Bytes Scanned: <strong className="text-zinc-700 dark:text-zinc-300">{queryExecutionStats.bytesProcessed}</strong></span>
                  <span>Execution Time: <strong className="text-zinc-700 dark:text-zinc-300">{queryExecutionStats.executionTimeMs} ms</strong></span>
                  <span>Rows Matched: <strong className="text-zinc-700 dark:text-zinc-300">{queryExecutionStats.rowsReturned}</strong></span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} /> Execution Status: Succeeded
                </div>
              </div>
            )}
          </div>

          {/* Results Tabular Display */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon size={14} className="text-indigo-500" />
                Query Result Projection ({activeTemplate.sampleOutput.length} Rows)
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Format: GoogleSQL Relational Schema
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
                    {Object.keys(activeTemplate.sampleOutput[0] || {}).map(col => (
                      <th key={col} className="py-2.5 px-4 font-semibold uppercase text-[10px]">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                  {activeTemplate.sampleOutput.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-4 text-zinc-800 dark:text-zinc-200 tabular-nums">
                          {typeof val === 'number' ? val.toLocaleString('en-IN') : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 3: Edge Registry Data Table */}
      {activeTab === 'DATA_TABLE' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Corporate Topology Edge Registry
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Comprehensive catalog of directed vertex relationships and ownership percentages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="graph-edge-type-select" className="text-xs text-zinc-500 font-medium">Type:</label>
              <select
                id="graph-edge-type-select"
                name="graph-edge-type-select"
                value={selectedEdgeType}
                onChange={e => setSelectedEdgeType(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Types</option>
                <option value="OWNS_STAKE">OWNS_STAKE</option>
                <option value="SUPPLIES">SUPPLIES</option>
                <option value="REGULATES">REGULATES</option>
                <option value="INSTITUTIONAL_HOLDING">INSTITUTIONAL_HOLDING</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                  <th className="py-3 px-4">Edge ID</th>
                  <th className="py-3 px-4">Source Vertex</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Destination Vertex</th>
                  <th className="py-3 px-4">Relationship Description</th>
                  <th className="py-3 px-4 text-right font-mono">Weight / Stake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredEdges.map(edge => {
                  const src = GRAPH_NODES.find(n => n.id === edge.source);
                  const tgt = GRAPH_NODES.find(n => n.id === edge.target);
                  return (
                    <tr key={edge.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">{edge.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{src?.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">:{src?.type}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {edge.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{tgt?.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">:{tgt?.type}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 text-xs">{edge.detail}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">
                        {edge.weight ? `${edge.weight}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BigQueryGraphView;
