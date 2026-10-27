import {
  Alert,
  Empty,
  Button,
  Descriptions,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { DrawerProps, ModalProps } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import DesignDrawer from '../components/ui/DesignDrawer';
import PageCard from '../components/ui/PageCard';
import CompactSearch from '../components/ui/CompactSearch';
import TableActions from '../components/TableActions';
import DeviceMap from './DeviceMap';
import { load as loadSolutions } from './Solutions';

type Role = '项目管理员' | '值班人员' | '技术人员';
type Log = { time: string; actor: string; action: string };
type Alarm = {
  id: string;
  project: string;
  device: string;
  type: string;
  time: string;
  status: string;
  owner: string;
  originalOwner: string;
  notification: string;
  logs: Log[];
};
type Ticket = {
  id: string;
  alarm: string;
  project: string;
  device: string;
  description: string;
  status: string;
  owner: string;
  logs: Log[];
  result: string;
  point?: string;
  occurredAt?: string;
  photo?: string;
  createdAt?: string;
};
type Person = { name: string; phone: string };
type Shift = { project: string; start: string; end: string; owner: string };
type DailyShift = {
  id: string;
  project: string;
  start: string;
  end: string;
  owner: string;
  note: string;
  date?: string;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
type Handover = {
  from: string;
  to: string;
  note: string;
  ids: string[];
  status: string;
  time: string;
};
type Data = {
  role: Role;
  dutyUser: string;
  alarms: Alarm[];
  tickets: Ticket[];
  people: Person[];
  shift: Shift;
  dailyShifts: DailyShift[];
  handover: Handover | null;
  solutions: string[];
};
const now = () => new Date().toLocaleString('zh-CN', { hour12: false });
const entry = (actor: string, action: string): Log => ({ time: now(), actor, action });
const initial: Data = {
  role: '项目管理员',
  dutyUser: '李明',
  people: [
    { name: '李明', phone: '13800000000' },
    { name: '王芳', phone: '13900000000' },
  ],
  shift: {
    project: '滨江巡检项目',
    start: '2026-10-27 09:00',
    end: '2026-10-27 18:00',
    owner: '李明',
  },
  dailyShifts: [
    {
      id: 'shift-initial',
      project: '滨江巡检项目',
      start: `${today()} 00:00`,
      end: dayjs().add(1, 'day').format('YYYY-MM-DD') + ' 00:00',
      owner: '李明',
      note: '',
    },
  ],
  alarms: [],
  tickets: [],
  handover: null,
  solutions: ['机场离线排查：检查最后心跳、网络与供电，必要时联系现场人员。'],
};
const key = 'ops-review-v3';
const mockAlarms = (): Alarm[] => [
  {
    id: 'MOCK-001',
    project: '滨江巡检项目',
    device: '机场 SN：DOCK-001',
    type: '机场连续 3 分钟未接收到心跳，最后在线时间请查看设备详情。',
    time: `${today()} 09:12`,
    status: '待确认',
    owner: '李明',
    originalOwner: '李明',
    notification: '发送成功（示例）',
    logs: [entry('系统', '设备安全：机场离线，已模拟发送飞书通知')],
  },
  {
    id: 'MOCK-002',
    project: '滨江巡检项目',
    device: '无人机 SN：DRONE-002',
    type: '无人机离舱已超过 10 分钟，请立即确认。',
    time: `${today()} 08:50`,
    status: '处理中',
    owner: '李明',
    originalOwner: '李明',
    notification: '发送成功（示例）',
    logs: [entry('系统', '设备安全：无人机离舱超时'), entry('李明', '已确认，正在排查')],
  },
  {
    id: 'MOCK-003',
    project: '滨江巡检项目',
    device: '订单 ORD-1003',
    type: '拍摄失败：设备未响应，请检查。',
    time: `${today()} 08:30`,
    status: '待确认',
    owner: '李明',
    originalOwner: '李明',
    notification: '发送成功（示例）',
    logs: [entry('系统', '拍摄通知：拍摄异常')],
  },
  {
    id: 'MOCK-004',
    project: '滨江巡检项目',
    device: '订单 ORD-1004',
    type: '上传过慢，整体上传时长已超过 4 分钟，请检查。',
    time: `${today()} 08:10`,
    status: '待确认',
    owner: '李明',
    originalOwner: '李明',
    notification: '发送成功（示例）',
    logs: [entry('系统', '超时通知：整体上传超时')],
  },
];
function read(): Data {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null') as
      (Data & { mockVersion?: number }) | null;
    const data = stored ?? initial;
    const source =
      data.dailyShifts ??
      (data.shift
        ? [
            {
              id: 'legacy-shift',
              project: data.shift.project,
              date: data.shift.start.slice(0, 10),
              owner: data.shift.owner,
              note: '由原排班记录转换',
            },
          ]
        : []);
    const dailyShifts = source.map((s) => ({
      ...s,
      start: s.start || `${s.date} 00:00`,
      end: s.end || `${dayjs(s.date).add(1, 'day').format('YYYY-MM-DD')} 00:00`,
    }));
    const alarms =
      stored?.mockVersion === 1
        ? data.alarms
        : [...data.alarms, ...mockAlarms().filter((a) => !data.alarms.some((x) => x.id === a.id))];
    const migrated = { ...data, dailyShifts, alarms, mockVersion: 1 };
    if (!stored || stored.mockVersion !== 1) localStorage.setItem(key, JSON.stringify(migrated));
    return migrated;
  } catch {
    return { ...initial, alarms: mockAlarms() };
  }
}
function useData() {
  const [data, setData] = useState<Data>(read);
  const save = (next: Data) => {
    localStorage.setItem(key, JSON.stringify({ ...next, mockVersion: 1 }));
    setData(next);
  };
  return [data, save] as const;
}
function Layout({ children }: { data: Data; save: (d: Data) => void; children: React.ReactNode }) {
  return (
    <div className="admin-page operations-page">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {children}
      </Space>
    </div>
  );
}
function PersonDialog({
  open,
  title,
  footer,
  onClose,
  children,
}: DrawerProps & { kind?: 'form' | 'detail' }) {
  return (
    <Modal
      centered
      open={open}
      title={title}
      footer={footer}
      onCancel={onClose as ModalProps['onCancel']}
      destroyOnHidden
    >
      {children}
    </Modal>
  );
}
function status(s: string) {
  return <Tag color={s === '已关闭' ? 'default' : s.startsWith('待') ? 'orange' : 'blue'}>{s}</Tag>;
}
function history(logs: Log[]) {
  return logs.length ? (
    <Space direction="vertical">
      {logs.map((l, i) => (
        <Typography.Text key={i}>
          {l.time} · {l.actor} · {l.action}
        </Typography.Text>
      ))}
    </Space>
  ) : (
    '暂无记录'
  );
}
const ac = [
  { title: '告警编号', width: 120, dataIndex: 'id' },
  { title: '项目', width: 160, dataIndex: 'project' },
  { title: '设备 / 对象', width: 160, dataIndex: 'device' },
  { title: '告警类型', width: 220, dataIndex: 'type' },
  { title: '发生时间', width: 180, dataIndex: 'time' },
  { title: '责任人', width: 110, dataIndex: 'owner' },
  { title: '状态', width: 110, dataIndex: 'status', render: status },
];
const tc = [
  { title: '工单编号', width: 120, dataIndex: 'id' },
  { title: '来源告警', width: 130, dataIndex: 'alarm' },
  { title: '项目', width: 160, dataIndex: 'project' },
  { title: '设备', width: 150, dataIndex: 'device' },
  { title: '问题', width: 240, dataIndex: 'description' },
  { title: '处理人', width: 110, dataIndex: 'owner' },
  { title: '状态', width: 110, dataIndex: 'status', render: status },
];
export function Workbench() {
  const [d, save] = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState('待确认');
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverForm] = Form.useForm();
  const at = dayjs();
  const daily = d.dailyShifts.find(
    (s) =>
      s.project === d.shift.project && !at.isBefore(dayjs(s.start)) && at.isBefore(dayjs(s.end)),
  );
  const projectAlarms = d.alarms.filter((a) => a.project === d.shift.project);
  const projectTickets = d.tickets.filter((t) => t.project === d.shift.project);
  const open = projectAlarms.filter((a) => a.status !== '已关闭');
  const pending = projectAlarms.filter((a) => a.status === '待确认');
  const processing = projectAlarms.filter((a) => a.status === '处理中');
  const tickets = projectTickets.filter((t) => t.status !== '已关闭');
  const unassigned = tickets.filter((t) => t.status === '待指派');
  const review = projectTickets.filter(
    (t) => t.status === '已关闭' && open.some((a) => a.id === t.alarm),
  );
  const notifyFailed = open.filter((a) => !a.notification.startsWith('发送成功'));
  const canSubmit =
    d.role === '值班人员' && d.dutyUser === daily?.owner && d.handover?.status !== '待确认';
  const canAccept =
    d.role === '值班人员' && d.handover?.status === '待确认' && d.dutyUser === d.handover.to;
  const items =
    tab === '工单'
      ? tickets
      : tab === '待复核'
        ? open.filter((a) => review.some((t) => t.alarm === a.id))
        : tab === '通知异常'
          ? notifyFailed
          : tab === '待确认'
            ? pending
            : processing;
  const sorted = [...items].sort((a, b) =>
    ('time' in a ? a.time : a.createdAt || '').localeCompare(
      'time' in b ? b.time : b.createdAt || '',
    ),
  );
  const goTo = (item: Alarm | Ticket) =>
    navigate('type' in item ? '/alerts' : '/tickets', {
      state: 'type' in item ? { alarmId: item.id } : { ticketId: item.id },
    });
  return (
    <Layout data={d} save={save}>
      <PageCard className="workbench-context">
        <div>
          <span className="workbench-eyebrow">当前项目</span>
          <h2>{d.shift.project}</h2>
        </div>
        <div className="workbench-duty">
          <span className="workbench-eyebrow">当前值班</span>
          <div>
            <strong>{daily?.owner || '未排班'}</strong>
            <span>
              {daily
                ? `${dayjs(daily.start).format('MM-DD HH:mm')} — ${dayjs(daily.end).format('MM-DD HH:mm')}`
                : '当前时段暂无值班人员'}
            </span>
          </div>
        </div>
        {d.role === '项目管理员' && (
          <Button onClick={() => navigate('/settings')}>{daily ? '查看排班' : '安排值班'}</Button>
        )}
      </PageCard>
      {!daily && (
        <Alert
          type="warning"
          showIcon
          message="当前时段未排班，请安排值班人员，避免告警无人跟进。"
        />
      )}
      <div className="workbench-metrics">
        {[
          {
            label: '待确认告警',
            count: pending.length,
            target: '待确认',
            hint: '确认异常，开始处置',
            tone: 'warning',
          },
          {
            label: '处理中告警',
            count: processing.length,
            target: '处理中',
            hint: '跟进处理，记录结果',
            tone: 'primary',
          },
          {
            label: '待指派工单',
            count: unassigned.length,
            target: '工单',
            hint: '分派技术人员处理',
            tone: 'primary',
          },
        ].map((m) => (
          <button
            key={m.label}
            className={`workbench-metric ${tab === m.target ? 'is-active' : ''}`}
            onClick={() => {
              if (m.target === '工单') navigate('/tickets', { state: { filter: '待指派' } });
              else setTab(m.target);
            }}
          >
            <div>
              <span>{m.label}</span>
              <strong className={m.count ? m.tone : ''}>
                {m.count}
                <small> 条</small>
              </strong>
            </div>
            <span className="metric-hint">
              {m.hint}
              <span aria-hidden="true"> →</span>
            </span>
          </button>
        ))}
      </div>
      <div className="workbench-main">
        <DeviceMap alarms={projectAlarms} />
        <PageCard className="workbench-tasks">
          <div className="workbench-section-heading">
            <h3>待办事项</h3>
            <Button
              type="link"
              onClick={() =>
                navigate(tab === '工单' ? '/tickets' : '/alerts', {
                  state: { filter: ['待确认', '处理中'].includes(tab) ? tab : '全部' },
                })
              }
            >
              查看全部
            </Button>
          </div>
          <span className="workbench-eyebrow">当前项目 · 未完成事项跨日保留</span>
          {(notifyFailed.length > 0 || review.length > 0) && (
            <div className="workbench-notices">
              {notifyFailed.length > 0 && (
                <Button type="link" onClick={() => setTab('通知异常')}>
                  通知异常 {notifyFailed.length} 条
                </Button>
              )}
              {review.length > 0 && (
                <Button type="link" onClick={() => setTab('待复核')}>
                  工单已解决，待复核 {review.length} 条
                </Button>
              )}
            </div>
          )}
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: '待确认', label: `待确认 ${pending.length}` },
              { key: '处理中', label: `处理中 ${processing.length}` },
              { key: '工单', label: `工单 ${tickets.length}` },
              ...(tab === '通知异常'
                ? [{ key: tab, label: `通知异常 ${notifyFailed.length}` }]
                : []),
              ...(tab === '待复核' ? [{ key: tab, label: `待复核 ${review.length}` }] : []),
            ]}
          />
          <div className="workbench-task-list">
            {sorted.length ? (
              sorted.slice(0, 5).map((item) => (
                <button className="workbench-task" key={item.id} onClick={() => goTo(item)}>
                  <div className="task-meta">
                    <span>{item.id}</span>
                    {status(item.status)}
                  </div>
                  <div className="task-title">{'type' in item ? item.type : item.description}</div>
                  <div className="task-secondary">
                    {item.device} · {item.owner || '未指派'}
                  </div>
                  <div className="task-bottom">
                    <time>{'time' in item ? item.time : item.createdAt || '时间未记录'}</time>
                    <span>
                      {'type' in item
                        ? '查看并处理'
                        : item.status === '待指派'
                          ? '指派工单'
                          : '跟进工单'}{' '}
                      →
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="workbench-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={tab === '工单' ? '暂无未完成工单' : '当前分类暂无待办'}
                />
                <Typography.Text type="secondary">新事项将在此处汇总</Typography.Text>
              </div>
            )}
          </div>
          {sorted.length > 0 && (
            <div className="workbench-task-foot">
              按发生时间先后排列 · 展示 {Math.min(5, sorted.length)} / {sorted.length} 条
            </div>
          )}
        </PageCard>
      </div>
      <PageCard className="workbench-handover">
        <div>
          <h3>值班交接</h3>
          <span className="workbench-eyebrow">
            未关闭告警 {open.length} 条 · 未完成工单 {tickets.length} 条
          </span>
        </div>
        <div className="handover-summary">
          {d.handover ? (
            <>
              <div>
                {d.handover.from} → {d.handover.to} {status(d.handover.status)}
              </div>
              <Typography.Paragraph ellipsis={{ rows: 1, tooltip: d.handover.note }}>
                {d.handover.note}
              </Typography.Paragraph>
            </>
          ) : (
            <>
              <div>暂无交接记录</div>
              <span className="workbench-eyebrow">由当班人员发起，接班人员确认后接手告警。</span>
            </>
          )}
        </div>
        <Button
          onClick={() => {
            handoverForm.resetFields();
            setHandoverOpen(true);
          }}
        >
          {canSubmit ? '发起交接' : canAccept ? '确认接班' : '查看交接'}
        </Button>
      </PageCard>
      <DesignDrawer
        title={canSubmit ? '发起值班交接' : '值班交接详情'}
        kind={canSubmit ? 'form' : 'detail'}
        open={handoverOpen}
        onClose={() => setHandoverOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setHandoverOpen(false)}>关闭</Button>
            {canSubmit && (
              <Button type="primary" onClick={() => handoverForm.submit()}>
                提交交接
              </Button>
            )}
            {canAccept && (
              <Button
                type="primary"
                onClick={() => {
                  const h = d.handover!;
                  save({
                    ...d,
                    alarms: d.alarms.map((a) =>
                      h.ids.includes(a.id) && a.status !== '已关闭'
                        ? { ...a, owner: h.to, logs: [...a.logs, entry(h.to, '确认交接并接手')] }
                        : a,
                    ),
                    handover: { ...h, status: '已确认' },
                  });
                  setHandoverOpen(false);
                  message.success('已确认接班，未关闭告警已移交');
                }}
              >
                确认接班
              </Button>
            )}
          </Space>
        }
      >
        <Alert showIcon type="info" message="接班确认后移交未关闭告警，工单继续由原处理人负责。" />
        <div className="handover-detail-content">
          {canSubmit ? (
            <Form
              form={handoverForm}
              layout="vertical"
              className="design-form"
              onFinish={({ to, note }) => {
                save({
                  ...d,
                  handover: {
                    from: daily!.owner,
                    to,
                    note: note.trim(),
                    ids: open.map((a) => a.id),
                    status: '待确认',
                    time: now(),
                  },
                });
                setHandoverOpen(false);
                message.success('交接已提交，等待接班人确认');
              }}
            >
              <Form.Item
                label="接班人员"
                name="to"
                rules={[{ required: true, message: '请选择接班人员' }]}
              >
                <Select
                  placeholder="请选择接班人员"
                  options={d.people
                    .filter((p) => p.name !== daily?.owner)
                    .map((p) => ({ value: p.name, label: p.name }))}
                />
              </Form.Item>
              <Form.Item
                label="交接说明"
                name="note"
                rules={[{ required: true, whitespace: true, message: '请填写交接说明' }]}
              >
                <Input.TextArea
                  rows={4}
                  maxLength={500}
                  showCount
                  placeholder="说明当前进展、待跟进事项和注意事项"
                />
              </Form.Item>
            </Form>
          ) : d.handover ? (
            <Descriptions
              column={1}
              items={[
                { key: 'from', label: '交班人员', children: d.handover.from },
                { key: 'to', label: '接班人员', children: d.handover.to },
                { key: 'state', label: '交接状态', children: status(d.handover.status) },
                { key: 'time', label: '提交时间', children: d.handover.time },
                { key: 'note', label: '交接说明', children: d.handover.note },
              ]}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无交接记录，由当班人员发起交接"
            />
          )}
          <h3>{canSubmit ? '本次交接告警' : '交接关联告警'}</h3>
          {(canSubmit ? open : projectAlarms.filter((a) => d.handover?.ids.includes(a.id))).map(
            (a) => (
              <div className="handover-alarm" key={a.id}>
                <span>
                  {a.id} · {a.type}
                </span>
                {status(a.status)}
                <Button type="link" onClick={() => goTo(a)}>
                  查看
                </Button>
              </div>
            ),
          )}
        </div>
      </DesignDrawer>
    </Layout>
  );
}
export function Alerts() {
  const [d, save] = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [id, setId] = useState((location.state as { alarmId?: string } | null)?.alarmId || '');
  const [filter, setFilter] = useState(
    (location.state as { filter?: string } | null)?.filter || '全部',
  );
  const [keyword, setKeyword] = useState(
    (location.state as { keyword?: string } | null)?.keyword || '',
  );
  const [action, setAction] = useState('');
  const [text, setText] = useState('');
  const [query, setQuery] = useState(keyword);
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState('已解决');
  const [solutionPreview, setSolutionPreview] = useState<
    ReturnType<typeof loadSolutions>[number] | null
  >(null);
  const a = d.alarms.find((x) => x.id === id);
  const actor = d.role === '项目管理员' ? '陈主管' : d.dutyUser;
  const can = d.role !== '技术人员';
  const rules: [string, string[]][] = [
    ['机场离线', ['心跳', '机场离线']],
    ['无人机离舱超时', ['离舱']],
    ['无人机低电量', ['电量']],
    ['舱盖开启超时', ['舱盖']],
    ['电池循环次数超限', ['循环次数']],
    ['电池温度过高', ['电池温度']],
    ['无人机异常悬停', ['异常悬停']],
    ['起飞超时', ['起飞已达', '起飞超时']],
    ['拍摄动作超时', ['拍摄动作']],
    ['拍摄失败', ['拍摄失败']],
    ['剪辑失败', ['剪辑失败']],
    ['上传失败', ['上传失败']],
    ['上传超时', ['上传过慢', '上传超时']],
    ['剪辑模板缺失', ['模板缺失']],
    ['证书过期', ['证书过期']],
    ['触碰限飞区边界', ['触碰限飞区']],
    ['穿越限飞区', ['穿越限飞区']],
    ['飞出拍摄区', ['飞出拍摄区']],
    ['超出限高', ['超出限高']],
  ];
  const category = a
    ? rules.find(
        ([name, words]) => a.type.includes(name) || words.some((word) => a.type.includes(word)),
      )?.[0] || ''
    : '';
  const deviceType = a
    ? category.startsWith('电池')
      ? '电池'
      : a.device.includes('机场') || a.device.includes('DOCK')
        ? '机场'
        : a.device.includes('无人机') || a.device.includes('DRONE')
          ? '无人机'
          : a.device.includes('订单')
            ? '订单 / 任务'
            : category === '证书过期'
              ? '系统'
              : ''
    : '';
  const recommended = loadSolutions().filter(
    (s) => s.active && s.alarmType === category && s.deviceType === deviceType,
  );

  function update(p: Partial<Alarm>, description: string) {
    if (!a) return;
    save({
      ...d,
      alarms: d.alarms.map((x) =>
        x.id === id ? { ...x, ...p, logs: [...x.logs, entry(actor, description)] } : x,
      ),
    });
  }
  return (
    <Layout data={d} save={save}>
      <PageCard>
        <Space wrap>
          <CompactSearch
            placeholder="查询项目设备或告警类型"
            value={keyword}
            onChange={setKeyword}
            onSearch={() => {
              setQuery(keyword.trim());
              setPage(1);
            }}
          />
          <span className="filter-label">状态</span>
          <Select
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            style={{ width: 140 }}
            options={['全部', '待确认', '处理中', '已关闭', '未关闭'].map((value) => ({ value }))}
          />
          <Button
            type="link"
            icon={<ReloadOutlined />}
            onClick={() => {
              setKeyword('');
              setQuery('');
              setPage(1);
              setFilter('全部');
            }}
          >
            重置
          </Button>
        </Space>
      </PageCard>
      <PageCard list>
        <div className="list-toolbar">
          <h2 className="list-title">告警列表</h2>
        </div>
        <Table
          rowKey="id"
          dataSource={d.alarms.filter(
            (a) =>
              [a.project, a.device, a.type, a.id].some((v) => v.includes(query)) &&
              (filter === '全部' ||
                (filter === '未关闭' ? a.status !== '已关闭' : a.status === filter)),
          )}
          columns={[
            ...ac,
            {
              title: '操作',
              width: 120,
              fixed: 'right' as const,
              render: (_: unknown, row: Alarm) => (
                <TableActions
                  actions={[{ key: 'detail', label: '查看详情', onClick: () => setId(row.id) }]}
                />
              ),
            },
          ]}
          scroll={{ x: 1180 }}
          pagination={{
            current: page,
            onChange: (next) => setPage(next),
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
          }}
        />
      </PageCard>
      <DesignDrawer
        title="告警详情"
        open={!!a}
        onClose={() => setId('')}
        footer={
          a && (
            <Space wrap>
              {can && a.status === '待确认' && (
                <Button type="primary" onClick={() => update({ status: '处理中' }, '确认告警')}>
                  确认告警
                </Button>
              )}
              {can && a.status === '处理中' && (
                <>
                  <Button
                    onClick={() => {
                      setText('');
                      setAction('记录处置');
                    }}
                  >
                    记录处置
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setText(a.type);
                      setAction('转工单');
                    }}
                  >
                    转工单
                  </Button>
                  <Button
                    onClick={() => {
                      setText('');
                      setAction('关闭告警');
                    }}
                  >
                    关闭告警
                  </Button>
                </>
              )}
              {d.role === '项目管理员' && a.status !== '已关闭' && (
                <Button
                  onClick={() => {
                    setText(d.people[0]?.name || '');
                    setAction('指定责任人');
                  }}
                >
                  指定责任人
                </Button>
              )}
            </Space>
          )
        }
      >
        {a && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions
              className="aligned-descriptions"
              size="small"
              column={1}
              items={[
                { key: 'a', label: '告警', children: `${a.id} · ${a.type}` },
                { key: 'b', label: '项目 / 设备', children: `${a.project} / ${a.device}` },
                { key: 'c', label: '发生时间', children: a.time },
                {
                  key: 'd',
                  label: '当前责任人 / 初始责任人',
                  children: `${a.owner} / ${a.originalOwner}`,
                },
                { key: 'e', label: '处置状态', children: status(a.status) },
                { key: 'e2', label: '异常状态', children: '未知（等待来源数据）' },
                { key: 'f', label: '飞书通知', children: a.notification },
                {
                  key: 'g',
                  label: '关联工单',
                  children:
                    d.tickets
                      .filter((t) => t.alarm === a.id)
                      .map((t) => `${t.id} · ${t.status} · ${t.result || '暂无结果'}`)
                      .join('；') || '暂无',
                },
                {
                  key: 'h',
                  label: '推荐处置方案',
                  children: (
                    <Space direction="vertical" size={4}>
                      {recommended.length ? (
                        recommended.map((s) => (
                          <Button key={s.id} type="link" onClick={() => setSolutionPreview(s)}>
                            {s.title}
                          </Button>
                        ))
                      ) : (
                        <Typography.Text type="secondary">暂无匹配方案</Typography.Text>
                      )}
                      <Button
                        type="link"
                        onClick={() => navigate('/solutions', { state: { keyword: category } })}
                      >
                        关键词搜索方案
                      </Button>
                    </Space>
                  ),
                },
                { key: 'i', label: '处置记录', children: history(a.logs) },
              ]}
            />
          </Space>
        )}
      </DesignDrawer>
      <DesignDrawer
        title="处置方案"
        open={!!solutionPreview}
        onClose={() => setSolutionPreview(null)}
      >
        {solutionPreview && (
          <>
            <Typography.Title level={4}>{solutionPreview.title}</Typography.Title>
            <Descriptions
              column={1}
              items={[
                {
                  key: '1',
                  label: '适用范围',
                  children: `${solutionPreview.alarmType} / ${solutionPreview.deviceType}`,
                },
                { key: '2', label: '问题现象', children: solutionPreview.symptom },
                {
                  key: '3',
                  label: '处理步骤',
                  children: <div style={{ whiteSpace: 'pre-wrap' }}>{solutionPreview.steps}</div>,
                },
                { key: '4', label: '升级条件', children: solutionPreview.escalation || '未填写' },
              ]}
            />
            <Button
              type="link"
              onClick={() => navigate('/solutions', { state: { keyword: solutionPreview.title } })}
            >
              查看方案库
            </Button>
          </>
        )}
      </DesignDrawer>
      <DesignDrawer
        kind="form"
        title={action}
        open={!!action}
        onClose={() => setAction('')}
        footer={
          <Space>
            <Button onClick={() => setAction('')}>取消</Button>
            <Button
              type="primary"
              onClick={() => {
                if (!a || !text.trim()) {
                  message.warning('请填写内容');
                  return;
                }
                if (action === '转工单') {
                  if (d.tickets.some((t) => t.alarm === a.id && t.status !== '已关闭')) {
                    message.warning('已有未关闭关联工单');
                    return;
                  }
                  const t: Ticket = {
                    id: `WO-${String(d.tickets.length + 1).padStart(3, '0')}`,
                    alarm: a.id,
                    project: a.project,
                    device: a.device,
                    description: text,
                    createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    status: '待指派',
                    owner: '未指派',
                    result: '',
                    logs: [entry(actor, '由告警创建工单')],
                  };
                  save({
                    ...d,
                    tickets: [...d.tickets, t],
                    alarms: d.alarms.map((x) =>
                      x.id === id
                        ? { ...x, logs: [...x.logs, entry(actor, `创建工单 ${t.id}`)] }
                        : x,
                    ),
                  });
                } else if (action === '关闭告警') {
                  update({ status: '已关闭' }, `${reason}：${text}`);
                } else if (action === '指定责任人') {
                  update({ owner: text, notification: '人工协调' }, `指定责任人 ${text}`);
                } else update({}, `处置记录：${text}`);
                setAction('');
                message.success('已保存');
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" className="design-form">
          {action === '关闭告警' && (
            <Form.Item label="关闭原因" required>
              <Select
                value={reason}
                onChange={setReason}
                style={{ width: '100%', marginBottom: 12 }}
                options={['已解决', '误报', '无需处理'].map((value) => ({ value }))}
              />
            </Form.Item>
          )}
          {action === '指定责任人' ? (
            <Form.Item label="责任人" required>
              <Select
                style={{ width: '100%' }}
                value={text}
                onChange={setText}
                options={d.people.map((p) => ({ value: p.name }))}
              />
            </Form.Item>
          ) : (
            <Form.Item label={action === '转工单' ? '问题描述' : '处理说明'} required>
              <Input.TextArea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="填写说明"
              />
            </Form.Item>
          )}
        </Form>
      </DesignDrawer>
    </Layout>
  );
}
export function Tickets() {
  const [d, save] = useData();
  const location = useLocation();
  const [id, setId] = useState((location.state as { ticketId?: string } | null)?.ticketId || '');
  const [tab, setTab] = useState(d.role === '技术人员' ? 'mine' : 'all');
  const [ticketFilter, setTicketFilter] = useState(
    (location.state as { filter?: string } | null)?.filter || '全部',
  );
  const [action, setAction] = useState('');
  const [text, setText] = useState('');
  const [device, setDevice] = useState('滨江机场 01');
  const [project, setProject] = useState(d.shift.project);
  const [point, setPoint] = useState('滨江公园');
  const [occurredAt, setOccurredAt] = useState(dayjs());
  const [photo, setPhoto] = useState<{ name: string; data: string } | null>(null);
  const [range, setRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const t = d.tickets.find((x) => x.id === id);
  const actor = d.role === '项目管理员' ? '陈主管' : d.role === '技术人员' ? '张伟' : d.dutyUser;
  function update(p: Partial<Ticket>, desc: string) {
    if (!t) return;
    save({
      ...d,
      tickets: d.tickets.map((x) =>
        x.id === id ? { ...x, ...p, logs: [...x.logs, entry(actor, desc)] } : x,
      ),
    });
  }
  const mine = d.role === '技术人员';
  const rows = d.tickets.filter(
    (x) =>
      (mine || tab === 'mine' ? x.owner === '张伟' : true) &&
      (ticketFilter === '全部' || x.status === ticketFilter) &&
      (!range || (!!x.createdAt && x.createdAt >= range[0] && x.createdAt <= range[1])),
  );
  return (
    <Layout data={d} save={save}>
      <PageCard>
        <Space wrap>
          <DatePicker.RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            value={range ? [dayjs(range[0]), dayjs(range[1])] : null}
            onChange={(v) => (
              setPage(1),
              setRange(
                v?.[0] && v?.[1]
                  ? [v[0].format('YYYY-MM-DD HH:mm'), v[1].format('YYYY-MM-DD HH:mm')]
                  : null,
              )
            )}
          />
          <span className="filter-label">工单状态</span>
          <Select
            value={ticketFilter}
            onChange={(value) => {
              setTicketFilter(value);
              setPage(1);
            }}
            style={{ width: 140 }}
            options={['全部', '待指派', '待受理', '处理中', '已关闭'].map((value) => ({ value }))}
          />
          <Button
            type="link"
            icon={<ReloadOutlined />}
            onClick={() => {
              setRange(null);
              setPage(1);
              setTicketFilter('全部');
            }}
          >
            重置
          </Button>
        </Space>
      </PageCard>
      <PageCard list>
        <div className="list-toolbar">
          <h2 className="list-title">工单中心</h2>
          {!mine && (
            <Button
              type="primary"
              onClick={() => {
                setText('');
                setProject(d.shift.project);
                setPoint('滨江公园');
                setDevice('滨江机场 01');
                setOccurredAt(dayjs());
                setPhoto(null);
                setAction('人工上报');
              }}
            >
              人工上报
            </Button>
          )}
        </div>
        <Tabs
          activeKey={mine ? 'mine' : tab}
          onChange={(value) => {
            setTab(value);
            setPage(1);
          }}
          items={
            mine
              ? [{ key: 'mine', label: '我的工单' }]
              : [
                  { key: 'all', label: '全部工单' },
                  { key: 'mine', label: '我的工单（张伟）' },
                ]
          }
        />
        <Table
          rowKey="id"
          dataSource={rows}
          scroll={{ x: 1140 }}
          pagination={{
            current: page,
            onChange: (next) => setPage(next),
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
          }}
          columns={[
            ...tc,
            {
              title: '操作',
              width: 120,
              fixed: 'right' as const,
              render: (_: unknown, row: Ticket) => (
                <TableActions
                  actions={[{ key: 'detail', label: '详情', onClick: () => setId(row.id) }]}
                />
              ),
            },
          ]}
        />
      </PageCard>
      <DesignDrawer
        title="工单详情"
        open={!!t}
        onClose={() => setId('')}
        footer={
          t && (
            <Space wrap>
              {d.role === '项目管理员' && t.status !== '已关闭' && (
                <Button
                  onClick={() => {
                    setText('张伟');
                    setAction('指派');
                  }}
                >
                  指派 / 转派
                </Button>
              )}
              {mine && t.status === '待受理' && (
                <>
                  <Button type="primary" onClick={() => update({ status: '处理中' }, '受理工单')}>
                    受理
                  </Button>
                  <Button
                    onClick={() => {
                      setText('');
                      setAction('退回');
                    }}
                  >
                    退回
                  </Button>
                </>
              )}
              {mine && t.status === '处理中' && (
                <>
                  <Button
                    onClick={() => {
                      setText('');
                      setAction('记录进度');
                    }}
                  >
                    记录进度
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setText('');
                      setAction('关闭工单');
                    }}
                  >
                    填写结果并关闭
                  </Button>
                </>
              )}
            </Space>
          )
        }
      >
        {t && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              className="aligned-descriptions"
              column={1}
              size="small"
              items={[
                { key: 'a', label: '工单', children: t.id },
                { key: 'b', label: '来源告警', children: t.alarm || '人工上报' },
                { key: 'c', label: '项目 / 设备', children: `${t.project} / ${t.device}` },
                { key: 'd', label: '问题', children: t.description },
                { key: 'point', label: '点位', children: t.point || '未记录' },
                { key: 'occurred', label: '发生时间', children: t.occurredAt || '未记录' },
                { key: 'created', label: '创建时间', children: t.createdAt || '未记录' },
                {
                  key: 'photo',
                  label: '现场照片',
                  children: t.photo ? (
                    <img src={t.photo} alt="现场照片" style={{ maxWidth: 240, maxHeight: 180 }} />
                  ) : (
                    '无'
                  ),
                },
                { key: 'e', label: '处理人', children: t.owner },
                { key: 'f', label: '状态', children: status(t.status) },
                { key: 'g', label: '处理结果', children: t.result || '暂无' },
                {
                  key: 'g2',
                  label: '值班排查记录',
                  children: history(d.alarms.find((a) => a.id === t.alarm)?.logs || []),
                },
                { key: 'h', label: '处理记录', children: history(t.logs) },
              ]}
            />
          </Space>
        )}
      </DesignDrawer>
      <DesignDrawer
        kind="form"
        title={action}
        open={!!action}
        onClose={() => setAction('')}
        footer={
          <Space>
            <Button onClick={() => setAction('')}>取消</Button>
            <Button
              type="primary"
              onClick={() => {
                if (!text.trim()) {
                  message.warning('请填写内容');
                  return;
                }
                if (action === '人工上报') {
                  if (!project.trim() || !point.trim() || !occurredAt.isValid()) {
                    message.warning('请填写项目、点位和发生时间');
                    return;
                  }
                  const ticket: Ticket = {
                    id: `WO-${String(d.tickets.length + 1).padStart(3, '0')}`,
                    alarm: '',
                    project: project.trim(),
                    device,
                    point: point.trim(),
                    occurredAt: occurredAt.format('YYYY-MM-DD HH:mm'),
                    createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    photo: photo?.data,
                    description: text,
                    status: '待指派',
                    owner: '未指派',
                    result: '',
                    logs: [entry(actor, '人工上报故障')],
                  };
                  save({ ...d, tickets: [...d.tickets, ticket] });
                } else if (t && action === '指派')
                  update({ owner: text, status: '待受理' }, `指派 ${text}；飞书通知（模拟）`);
                else if (t && action === '退回')
                  update({ owner: '未指派', status: '待指派' }, `退回：${text}`);
                else if (t && action === '记录进度') update({}, `处理进度：${text}`);
                else if (t && action === '关闭工单') {
                  save({
                    ...d,
                    tickets: d.tickets.map((x) =>
                      x.id === id
                        ? {
                            ...x,
                            status: '已关闭',
                            result: text,
                            logs: [...x.logs, entry(actor, `关闭工单：${text}`)],
                          }
                        : x,
                    ),
                    alarms: d.alarms.map((a) =>
                      a.id === t.alarm
                        ? {
                            ...a,
                            logs: [
                              ...a.logs,
                              entry('系统', `${t.id} 已关闭，提醒 ${a.owner} 跟进（模拟）`),
                            ],
                          }
                        : a,
                    ),
                  });
                }
                setAction('');
                message.success('操作已保存');
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        {action === '人工上报' && (
          <Form layout="vertical" className="design-form">
            <Form.Item label="项目" required>
              <Input value={project} onChange={(e) => setProject(e.target.value)} />
            </Form.Item>
            <Form.Item label="点位" required>
              <Input value={point} onChange={(e) => setPoint(e.target.value)} />
            </Form.Item>
            <Form.Item label="设备" required>
              <Select
                value={device}
                onChange={setDevice}
                options={['滨江机场 01', '无人机 02', '滨江机场 03'].map((value) => ({ value }))}
              />
            </Form.Item>
            <Form.Item label="发生时间" required>
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                value={occurredAt}
                allowClear={false}
                onChange={(v) => {
                  if (v) setOccurredAt(v);
                }}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="现场照片">
              <Upload
                accept="image/png,image/jpeg"
                maxCount={1}
                fileList={photo ? [{ uid: 'photo', name: photo.name, status: 'done' }] : []}
                beforeUpload={(file) => {
                  if (file.size > 2 * 1024 * 1024) {
                    message.warning('图片不能超过 2 MB');
                    return Upload.LIST_IGNORE;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setPhoto({ name: file.name, data: String(reader.result) });
                  reader.readAsDataURL(file);
                  return Upload.LIST_IGNORE;
                }}
                onRemove={() => {
                  setPhoto(null);
                  return true;
                }}
              >
                <Button icon={<UploadOutlined />}>上传照片</Button>
              </Upload>
            </Form.Item>
          </Form>
        )}
        <Form layout="vertical" className="design-form">
          <Form.Item
            label={action === '指派' ? '处理人' : action === '人工上报' ? '问题描述' : '处理说明'}
            required
          >
            {action === '指派' ? (
              <Select
                value={text}
                onChange={setText}
                style={{ width: '100%' }}
                options={[{ value: '张伟' }]}
              />
            ) : (
              <Input.TextArea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="填写问题或处理说明"
              />
            )}
          </Form.Item>
        </Form>
      </DesignDrawer>
    </Layout>
  );
}
export function Settings() {
  const [d, save] = useData();
  const [action, setAction] = useState('');
  const [form] = Form.useForm();
  const [editingPerson, setEditingPerson] = useState('');
  const [editingShift, setEditingShift] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [personFilter, setPersonFilter] = useState('');
  const [projectQuery, setProjectQuery] = useState('');
  const [personQuery, setPersonQuery] = useState('');
  const [shiftPage, setShiftPage] = useState(1);
  const [personPage, setPersonPage] = useState(1);
  const FormPanel = action === '人员' ? PersonDialog : DesignDrawer;
  return (
    <Layout data={d} save={save}>
      <PageCard list>
        <Tabs
          items={[
            {
              key: 'shift',
              label: '值班排班',
              children: (
                <>
                  <Space wrap style={{ marginBottom: 16 }}>
                    <CompactSearch
                      placeholder="查询项目"
                      value={projectFilter}
                      onChange={setProjectFilter}
                      onSearch={() => {
                        setProjectQuery(projectFilter.trim());
                        setShiftPage(1);
                      }}
                    />
                    <DatePicker
                      aria-label="筛选日期"
                      placeholder="选择日期"
                      allowClear
                      value={dateFilter ? dayjs(dateFilter) : null}
                      onChange={(v) => {
                        setDateFilter(v ? v.format('YYYY-MM-DD') : '');
                        setShiftPage(1);
                      }}
                      style={{ width: 180 }}
                    />
                    <Button
                      type="link"
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setDateFilter('');
                        setProjectFilter('');
                        setProjectQuery('');
                        setShiftPage(1);
                      }}
                    >
                      重置
                    </Button>
                    <Button
                      disabled={d.role !== '项目管理员'}
                      type="primary"
                      onClick={() => {
                        form.resetFields();
                        form.setFieldsValue({
                          project: d.shift.project,
                          range: [
                            dayjs(`${dateFilter || today()} 09:00`),
                            dayjs(`${dateFilter || today()} 18:00`),
                          ],
                          owner: d.people[0]?.name,
                          note: '',
                        });
                        setEditingShift('');
                        setAction('排班');
                      }}
                    >
                      新增排班
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    scroll={{ x: 1130 }}
                    pagination={{
                      current: shiftPage,
                      onChange: (next) => setShiftPage(next),
                      showTotal: (total) => `共 ${total} 条`,
                      showSizeChanger: true,
                    }}
                    dataSource={d.dailyShifts
                      .filter(
                        (x) =>
                          (!dateFilter ||
                            (dayjs(x.start).isBefore(dayjs(dateFilter).add(1, 'day')) &&
                              dayjs(x.end).isAfter(dayjs(dateFilter)))) &&
                          x.project.includes(projectQuery),
                      )
                      .sort((a, b) => a.start.localeCompare(b.start))}
                    locale={{ emptyText: '暂无排班，请为具体日期安排责任人' }}
                    columns={[
                      { title: '开始时间', dataIndex: 'start', width: 180 },
                      { title: '结束时间', dataIndex: 'end', width: 180 },
                      { title: '项目', width: 160, dataIndex: 'project' },
                      { title: '值班责任人', width: 120, dataIndex: 'owner' },
                      {
                        title: '手机号',
                        width: 150,
                        render: (_: unknown, row: DailyShift) => {
                          const phone = d.people.find((p) => p.name === row.owner)?.phone;
                          return phone
                            ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
                            : '未配置';
                        },
                      },
                      {
                        title: '备注',
                        width: 200,
                        dataIndex: 'note',
                        render: (v: string) => v || '—',
                      },
                      {
                        title: '操作',
                        width: 140,
                        fixed: 'right' as const,
                        render: (_: unknown, row: DailyShift) =>
                          d.role === '项目管理员' ? (
                            <TableActions
                              actions={[
                                {
                                  key: 'edit',
                                  label: '调整',
                                  onClick: () => {
                                    form.setFieldsValue({
                                      ...row,
                                      range: [dayjs(row.start), dayjs(row.end)],
                                    });
                                    setEditingShift(row.id);
                                    setAction('排班');
                                  },
                                },
                                {
                                  key: 'delete',
                                  label: '删除',
                                  danger: true,
                                  confirm: {
                                    title: '删除该排班？',
                                    description:
                                      '删除后该时间范围内的新告警将无法匹配此责任人；已产生的告警保留原记录。',
                                  },
                                  onClick: () => {
                                    save({
                                      ...d,
                                      dailyShifts: d.dailyShifts.filter((x) => x.id !== row.id),
                                    });
                                    message.success('排班已删除');
                                  },
                                },
                              ]}
                            />
                          ) : null,
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: 'people',
              label: '值班人员',
              children: (
                <>
                  <div className="list-toolbar">
                    <Space wrap>
                      <CompactSearch
                        placeholder="查询姓名或手机号"
                        value={personFilter}
                        onChange={setPersonFilter}
                        onSearch={() => {
                          setPersonQuery(personFilter.trim());
                          setPersonPage(1);
                        }}
                      />
                      <Button
                        type="link"
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setPersonFilter('');
                          setPersonQuery('');
                          setPersonPage(1);
                        }}
                      >
                        重置
                      </Button>
                    </Space>
                    <Button
                      type="primary"
                      disabled={d.role !== '项目管理员'}
                      onClick={() => {
                        form.resetFields();
                        setEditingPerson('');
                        setAction('人员');
                      }}
                    >
                      新增人员
                    </Button>
                  </div>
                  <Table
                    rowKey="phone"
                    scroll={{ x: 650 }}
                    pagination={{
                      current: personPage,
                      onChange: (next) => setPersonPage(next),
                      showTotal: (total) => `共 ${total} 条`,
                      showSizeChanger: true,
                    }}
                    dataSource={d.people.filter(
                      (p) => p.name.includes(personQuery) || p.phone.includes(personQuery),
                    )}
                    columns={[
                      { title: '姓名', width: 230, dataIndex: 'name' },
                      {
                        title: '手机号（飞书）',
                        width: 280,
                        dataIndex: 'phone',
                        render: (v: string) => v.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                      },
                      {
                        title: '操作',
                        width: 140,
                        fixed: 'right' as const,
                        render: (_: unknown, p: Person) =>
                          d.role === '项目管理员' ? (
                            <TableActions
                              actions={[
                                {
                                  key: 'edit',
                                  label: '编辑',
                                  onClick: () => {
                                    setEditingPerson(p.name);
                                    form.setFieldsValue(p);
                                    setAction('编辑人员');
                                  },
                                },
                                {
                                  key: 'delete',
                                  label: '删除',
                                  danger: true,
                                  confirm: {
                                    title: '删除值班人员？',
                                    description:
                                      '已关联排班的人员需先调整或删除排班；历史告警记录保留。',
                                  },
                                  onClick: () => {
                                    if (d.dailyShifts.some((x) => x.owner === p.name)) {
                                      message.warning('该人员已关联排班，请先调整或删除排班');
                                      return;
                                    }
                                    save({
                                      ...d,
                                      people: d.people.filter((x) => x.phone !== p.phone),
                                    });
                                    message.success('值班人员已删除');
                                  },
                                },
                              ]}
                            />
                          ) : null,
                      },
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
      </PageCard>
      <FormPanel
        kind="form"
        title={
          action === '排班'
            ? editingShift
              ? '调整排班'
              : '新增排班'
            : action === '编辑人员'
              ? '编辑值班人员'
              : '新增值班人员'
        }
        open={!!action}
        onClose={() => setAction('')}
        footer={
          <Space>
            <Button onClick={() => setAction('')}>取消</Button>
            <Button
              type="primary"
              onClick={() =>
                form.validateFields().then((v) => {
                  if (action === '排班') {
                    const start = v.range?.[0]?.format('YYYY-MM-DD HH:mm');
                    const end = v.range?.[1]?.format('YYYY-MM-DD HH:mm');
                    if (!start || !end || !dayjs(end).isAfter(dayjs(start))) {
                      message.warning('结束时间须晚于开始时间');
                      return;
                    }
                    if (
                      d.dailyShifts.some(
                        (x) =>
                          x.project.trim() === v.project.trim() &&
                          x.id !== editingShift &&
                          dayjs(start).isBefore(dayjs(x.end)) &&
                          dayjs(end).isAfter(dayjs(x.start)),
                      )
                    ) {
                      message.warning('该项目排班时间有重叠，请调整');
                      return;
                    }
                    if (!d.people.find((p) => p.name === v.owner)?.phone) {
                      message.warning('责任人未配置手机号');
                      return;
                    }
                    const record: DailyShift = {
                      project: v.project.trim(),
                      start,
                      end,
                      owner: v.owner,
                      note: v.note || '',
                      id: editingShift || `shift-${Date.now()}`,
                    };
                    save({
                      ...d,
                      dailyShifts: editingShift
                        ? d.dailyShifts.map((x) => (x.id === editingShift ? record : x))
                        : [...d.dailyShifts, record],
                    });
                  } else if (
                    d.people.some(
                      (p) => (p.name === v.name || p.phone === v.phone) && p.name !== editingPerson,
                    )
                  ) {
                    message.warning('姓名或手机号已存在');
                    return;
                  } else if (action === '编辑人员')
                    save({
                      ...d,
                      people: d.people.map((p) => (p.name === editingPerson ? v : p)),
                      dailyShifts: d.dailyShifts.map((x) =>
                        x.owner === editingPerson ? { ...x, owner: v.name } : x,
                      ),
                    });
                  else save({ ...d, people: [...d.people, v] });
                  setAction('');
                  message.success('已保存');
                })
              }
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="design-form">
          {action === '排班' ? (
            <>
              <Form.Item label="项目" name="project" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="值班时间范围"
                name="range"
                rules={[{ required: true, message: '请选择开始和结束时间' }]}
              >
                <DatePicker.RangePicker
                  allowClear
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="责任人" name="owner" rules={[{ required: true }]}>
                <Select options={d.people.map((p) => ({ value: p.name }))} />
              </Form.Item>
              <Form.Item label="备注（可选）" name="note">
                <Input placeholder="例如：临时调班、节假日值班" />
              </Form.Item>
              <Typography.Text type="secondary">
                按开始时间（含）至结束时间（不含）匹配项目告警；调整不会改写已产生告警的责任记录。
              </Typography.Text>
            </>
          ) : (
            <>
              <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="手机号（飞书）"
                name="phone"
                rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </FormPanel>
    </Layout>
  );
}
