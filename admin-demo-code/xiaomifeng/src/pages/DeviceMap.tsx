import { Button, Card, Descriptions, Empty, Segmented, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DesignDrawer from '../components/ui/DesignDrawer';

type Alarm = { id: string; device: string; type: string; time: string; status: string };
const devices = [
  {
    id: 'DOCK-001',
    name: '滨江机场 01',
    kind: '机场',
    status: '离线',
    point: '滨江公园',
    location: '滨江公园北入口',
    last: '09:09',
    x: 30,
    y: 42,
    weather: '多云，23°C',
    wind: '东南风 3 级',
  },
  {
    id: 'DRONE-002',
    name: '无人机 02',
    kind: '无人机',
    status: '在线',
    point: '滨江公园',
    location: '滨江公园北入口',
    last: '09:11',
    x: 46,
    y: 56,
    weather: '多云，23°C',
    wind: '东南风 3 级',
  },
  {
    id: 'DOCK-003',
    name: '滨江机场 03',
    kind: '机场',
    status: '故障',
    point: '城市广场',
    location: '城市广场西侧',
    last: '09:05',
    x: 72,
    y: 32,
    weather: '阴，22°C',
    wind: '东风 2 级',
  },
];
export default function DeviceMap({ alarms }: { alarms: Alarm[] }) {
  const [selected, setSelected] = useState(devices[0]);
  const [expanded, setExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filter, setFilter] = useState('全部');
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', close);
    };
  }, [expanded]);
  const visible = devices.filter((device) => filter === '全部' || device.status === filter);
  const navigate = useNavigate();
  const related = alarms.filter(
    (a) => a.device.includes(selected.id) || a.device.includes(selected.name),
  );
  return (
    <Card
      title="设备运行地图"
      extra={
        <Space>
          <Button type="link" onClick={() => setExpanded(!expanded)}>
            {expanded ? '退出大屏' : '展开大屏'}
          </Button>
        </Space>
      }
      className={expanded ? 'device-overview device-overview-full' : 'device-overview'}
    >
      <div className="device-summary">
        <Segmented
          aria-label="筛选设备状态"
          value={filter}
          onChange={(value) => {
            setFilter(value);
            const next = devices.find((item) => value === '全部' || item.status === value);
            if (next) setSelected(next);
          }}
          options={['全部', '在线', '离线', '故障'].map((value) => ({
            value,
            label: `${value} ${devices.filter((device) => value === '全部' || device.status === value).length}`,
          }))}
        />
        <span className="device-summary-time">最近上报 09:11</span>
      </div>
      <div className="device-map-layout">
        <div className="device-map" aria-label="设备分布示意地图">
          <svg
            className="device-map-base"
            viewBox="0 0 800 420"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect width="800" height="420" fill="#e8eef0" />
            <path
              d="M0 312 C130 263 192 320 311 277 S530 229 800 263 L800 420 L0 420 Z"
              fill="#cee5ed"
            />
            <path
              d="M60 0 L113 420 M222 0 L300 420 M520 0 L590 420 M710 0 L758 420 M0 90 L800 80 M0 190 L800 175 M0 315 L800 300"
              stroke="#fff"
              strokeWidth="12"
              fill="none"
            />
            <path
              d="M0 220 C160 160 350 135 800 110 M25 0 C180 145 400 160 800 235"
              stroke="#d4dce0"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M96 28 H200 V140 H96 Z M355 22 H480 V135 H355 Z M625 145 H756 V220 H625 Z"
              fill="#dbe8db"
            />
          </svg>
          <div className="map-caption">滨江片区 · 设备位置示意</div>
          {visible.map((item) => (
            <button
              key={item.id}
              className={`map-pin ${item.status === '在线' ? 'online' : item.status === '离线' ? 'offline' : 'fault'} ${selected.id === item.id ? 'selected' : ''}`}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              onClick={() => setSelected(item)}
              aria-label={`${item.name}，${item.status}`}
              aria-pressed={selected.id === item.id}
            >
              <span className="pin-point" />
              <span className="pin-label">{item.name}</span>
            </button>
          ))}
        </div>
        <div className="device-selected-summary">
          <div>
            <span
              className={`device-dot ${selected.status === '在线' ? 'online' : selected.status === '离线' ? 'offline' : 'fault'}`}
            />
            <strong>{selected.name}</strong>
            <Tag>{selected.status}</Tag>
            <div className="selected-location">
              {selected.location} · {selected.id}
            </div>
          </div>
          <div className="selected-weather">
            <strong>{selected.weather}</strong>
            <span>{selected.wind} · 今日</span>
          </div>
          <Button onClick={() => setDetailsOpen(true)}>设备详情</Button>
        </div>
        <DesignDrawer
          title="设备详情"
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          footer={<Button onClick={() => setDetailsOpen(false)}>关闭</Button>}
        >
          <aside className="device-detail">
            <div className="device-detail-title">
              <div>
                <Typography.Text type="secondary">设备详情</Typography.Text>
                <h3>{selected.name}</h3>
              </div>
              <Tag
                color={
                  selected.status === '在线'
                    ? 'success'
                    : selected.status === '离线'
                      ? 'default'
                      : 'error'
                }
              >
                {selected.status}
              </Tag>
            </div>
            <Descriptions
              column={1}
              size="small"
              items={[
                { key: 'a', label: '设备编号', children: selected.id },
                {
                  key: 'b',
                  label: '类型 / 点位',
                  children: `${selected.kind} / ${selected.point}`,
                },
                { key: 'c', label: '设备位置', children: selected.location },
                { key: 'd', label: '最近上报', children: `今日 ${selected.last}` },
                { key: 'e', label: '当地天气', children: selected.weather },
                { key: 'f', label: '风况', children: selected.wind },
              ]}
            />
            <div className="device-detail-subtitle">
              近期告警 <span>{related.length}</span>
            </div>
            {related.length ? (
              related.slice(0, 3).map((a) => (
                <button
                  className="device-alert-link"
                  key={a.id}
                  onClick={() => navigate('/alerts', { state: { alarmId: a.id } })}
                >
                  <span>{a.type}</span>
                  <small>
                    {a.time}　{a.status}
                  </small>
                </button>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联告警" />
            )}
            <Button
              type="link"
              onClick={() => navigate('/alerts', { state: { keyword: selected.id } })}
            >
              查看设备历史告警
            </Button>
          </aside>
        </DesignDrawer>
      </div>
      <div className="map-data-note">
        设备位置、运行状态与天气均为示例数据 · 点击地图标记切换设备
      </div>
    </Card>
  );
}
