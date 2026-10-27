import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { useState } from 'react';
import { ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import DesignDrawer from '../components/ui/DesignDrawer';
import PageCard from '../components/ui/PageCard';
import CompactSearch from '../components/ui/CompactSearch';
import TableActions from '../components/TableActions';

type Attachment = { name: string; type: string; data: string };
export type Solution = {
  id: string;
  title: string;
  alarmType: string;
  deviceType: string;
  keywords: string;
  symptom: string;
  steps: string;
  escalation: string;
  owner: string;
  updated: string;
  active: boolean;
  attachment?: Attachment;
};
const key = 'ops-solutions-v1';
const sample: Solution[] = [
  {
    id: 'QA-001',
    title: '机场离线排查',
    alarmType: '机场离线',
    deviceType: '机场',
    keywords: '离线 断网 心跳 供电',
    symptom: '机场连续 3 分钟未收到心跳。',
    steps:
      '1. 查看机场最后心跳时间和网络状态。\n2. 联系现场人员检查网络及供电。\n3. 恢复后确认设备重新上报。',
    escalation: '无法恢复时记录排查结果并转工单。',
    owner: '运维管理员',
    updated: '2026-10-27',
    active: true,
  },
];
const categories = [
  '机场离线',
  '无人机离舱超时',
  '无人机低电量',
  '舱盖开启超时',
  '电池循环次数超限',
  '电池温度过高',
  '无人机异常悬停',
  '起飞超时',
  '拍摄动作超时',
  '拍摄失败',
  '剪辑失败',
  '上传失败',
  '上传超时',
  '剪辑模板缺失',
  '证书过期',
  '触碰限飞区边界',
  '穿越限飞区',
  '飞出拍摄区',
  '超出限高',
];
export function load(): Solution[] {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? sample;
  } catch {
    return sample;
  }
}
export default function Solutions() {
  const location = useLocation();
  const [items, setItems] = useState<Solution[]>(load);
  const [query, setQuery] = useState(
    (location.state as { keyword?: string } | null)?.keyword || '',
  );
  const [filter, setFilter] = useState(
    (location.state as { keyword?: string } | null)?.keyword ? '启用' : '全部',
  );
  const [editing, setEditing] = useState<Solution | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Solution | null>(null);
  const [attachment, setAttachment] = useState<Attachment>();
  const [form] = Form.useForm();
  function save(next: Solution[]) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setItems(next);
      return true;
    } catch {
      message.error('本地存储空间不足，请减少附件大小');
      return false;
    }
  }
  function edit(item?: Solution) {
    setEditing(item || null);
    setAttachment(item?.attachment);
    form.resetFields();
    if (item) form.setFieldsValue(item);
    setShowForm(true);
  }
  const rows = items.filter(
    (s) =>
      (filter === '全部' || (filter === '启用' ? s.active : !s.active)) &&
      [s.title, s.alarmType, s.deviceType, s.keywords, s.symptom, s.steps].some((x) =>
        x.toLowerCase().includes(query.trim().toLowerCase()),
      ),
  );
  const upload = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'png', 'jpg', 'jpeg', 'txt', 'md'].includes(ext)) {
      message.error('仅支持 PDF、PNG、JPG、TXT、MD');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error('单个附件不能超过 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setAttachment({ name: file.name, type: ext, data: String(reader.result) });
    reader.onerror = () => message.error('读取失败，请重试');
    reader.readAsDataURL(file);
  };
  return (
    <div className="admin-page operations-page">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageCard>
          <Space wrap>
            <CompactSearch
              value={query}
              onChange={setQuery}
              onSearch={() => {}}
              placeholder="查询方案名称或关键词"
            />
            <Select
              value={filter}
              onChange={setFilter}
              style={{ width: 130 }}
              options={['全部', '启用', '停用'].map((value) => ({ value }))}
            />
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => {
                setQuery('');
                setFilter('全部');
              }}
            >
              重置
            </Button>
          </Space>
        </PageCard>
        <PageCard list>
          <div className="list-toolbar">
            <h2 className="list-title">处置方案库</h2>
            <Button type="primary" onClick={() => edit()}>
              新增方案
            </Button>
          </div>
          <Table
            rowKey="id"
            dataSource={rows}
            locale={{ emptyText: '未找到匹配方案，可调整关键词或新增方案' }}
            columns={[
              { title: '方案名称', width: 240, dataIndex: 'title' },
              { title: '适用告警', width: 160, dataIndex: 'alarmType' },
              { title: '适用设备', width: 120, dataIndex: 'deviceType' },
              { title: '维护人', width: 100, dataIndex: 'owner' },
              { title: '更新时间', width: 140, dataIndex: 'updated' },
              {
                title: '状态',
                width: 100,
                dataIndex: 'active',
                render: (active: boolean) => (
                  <Tag color={active ? 'success' : 'default'}>{active ? '启用' : '停用'}</Tag>
                ),
              },
              {
                title: '操作',
                width: 190,
                fixed: 'right',
                render: (_: unknown, s: Solution) => (
                  <TableActions
                    actions={[
                      { key: 'preview', label: '预览', onClick: () => setPreview(s) },
                      { key: 'edit', label: '编辑', onClick: () => edit(s) },
                      {
                        key: 'toggle',
                        label: s.active ? '停用' : '启用',
                        danger: s.active,
                        confirm: {
                          title: `确定${s.active ? '停用' : '启用'}该方案？`,
                          description: s.active
                            ? '停用后不再用于告警推荐。'
                            : '启用后可供查询使用。',
                        },
                        onClick: () => {
                          if (
                            save(
                              items.map((x) =>
                                x.id === s.id
                                  ? {
                                      ...x,
                                      active: !x.active,
                                      updated: new Date().toLocaleDateString('zh-CN'),
                                    }
                                  : x,
                              ),
                            )
                          )
                            message.success('状态已更新');
                        },
                      },
                    ]}
                  />
                ),
              },
            ]}
            scroll={{ x: 1050 }}
            pagination={{ showTotal: (total) => `共 ${total} 条`, showSizeChanger: true }}
          />
        </PageCard>
      </Space>
      <DesignDrawer
        kind="form"
        title={editing ? '编辑处置方案' : '新增处置方案'}
        open={showForm}
        onClose={() => setShowForm(false)}
        footer={
          <Space>
            <Button onClick={() => setShowForm(false)}>取消</Button>
            <Button
              type="primary"
              onClick={() =>
                form.validateFields().then((v) => {
                  const record: Solution = {
                    ...v,
                    id: editing?.id || `QA-${Date.now()}`,
                    active: editing?.active ?? true,
                    updated: new Date().toLocaleDateString('zh-CN'),
                    attachment,
                  };
                  if (
                    save(
                      editing
                        ? items.map((x) => (x.id === editing.id ? record : x))
                        : [record, ...items],
                    )
                  ) {
                    setShowForm(false);
                    message.success('方案已保存');
                  }
                })
              }
            >
              保存
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          message="正文可按关键词搜索；附件用于补充参考资料。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical" className="design-form">
          <Form.Item
            label="方案名称"
            name="title"
            rules={[{ required: true, message: '请输入方案名称' }]}
          >
            <Input placeholder="例如：机场离线排查" />
          </Form.Item>
          <div className="form-grid">
            <Form.Item
              label="适用告警类型"
              name="alarmType"
              rules={[{ required: true, message: '请选择告警类型' }]}
            >
              <Select showSearch options={categories.map((value) => ({ value }))} />
            </Form.Item>
            <Form.Item
              label="适用设备"
              name="deviceType"
              rules={[{ required: true, message: '请选择适用设备' }]}
            >
              <Select
                options={['机场', '无人机', '电池', '订单 / 任务', '系统', '其他'].map((value) => ({
                  value,
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item
            label="关键词"
            name="keywords"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="例如：离线、心跳、网络" />
          </Form.Item>
          <Form.Item
            label="问题现象"
            name="symptom"
            rules={[{ required: true, message: '请填写问题现象' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="排查与处理步骤"
            name="steps"
            rules={[{ required: true, message: '请填写处理步骤' }]}
          >
            <Input.TextArea rows={4} placeholder="按操作顺序填写步骤" />
          </Form.Item>
          <Form.Item label="升级条件" name="escalation">
            <Input.TextArea rows={2} placeholder="什么情况下需要转工单或升级" />
          </Form.Item>
          <Form.Item
            label="维护人"
            name="owner"
            rules={[{ required: true, message: '请输入维护人' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="参考附件">
            <Upload
              accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
              maxCount={1}
              fileList={
                attachment ? [{ uid: 'attachment', name: attachment.name, status: 'done' }] : []
              }
              beforeUpload={(file) => {
                upload(file);
                return Upload.LIST_IGNORE;
              }}
              onRemove={() => {
                setAttachment(undefined);
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>选择附件</Button>
            </Upload>
            <div className="field-hint">
              支持 PDF、PNG、JPG、TXT、MD，单个不超过 2 MB。正文参与搜索，附件内容暂不搜索。
            </div>
          </Form.Item>
        </Form>
      </DesignDrawer>
      <DesignDrawer title="方案预览" open={!!preview} onClose={() => setPreview(null)}>
        {preview && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={4}>
              {preview.title} {preview.active ? null : <Tag>已停用</Tag>}
            </Typography.Title>
            <Descriptions
              className="aligned-descriptions"
              size="small"
              column={2}
              items={[
                { key: '1', label: '适用告警', children: preview.alarmType },
                { key: '2', label: '适用设备', children: preview.deviceType },
                { key: '3', label: '关键词', children: preview.keywords },
                { key: '4', label: '维护人', children: preview.owner },
                { key: '5', label: '更新时间', children: preview.updated },
                { key: '6', label: '问题现象', children: preview.symptom },
                {
                  key: '7',
                  label: '处理步骤',
                  children: <div style={{ whiteSpace: 'pre-wrap' }}>{preview.steps}</div>,
                },
                { key: '8', label: '升级条件', children: preview.escalation || '未填写' },
              ]}
            />
            {preview.attachment && (
              <Card
                size="small"
                title={`参考附件：${preview.attachment.name}`}
                extra={
                  <a href={preview.attachment.data} download={preview.attachment.name}>
                    下载
                  </a>
                }
              >
                {['png', 'jpg', 'jpeg'].includes(preview.attachment.type) ? (
                  <img
                    alt={preview.attachment.name}
                    src={preview.attachment.data}
                    style={{ maxWidth: '100%' }}
                  />
                ) : ['txt', 'md'].includes(preview.attachment.type) ? (
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {new TextDecoder().decode(
                      Uint8Array.from(atob(preview.attachment.data.split(',')[1]), (c) =>
                        c.charCodeAt(0),
                      ),
                    )}
                  </pre>
                ) : (
                  <iframe
                    title={preview.attachment.name}
                    src={preview.attachment.data}
                    style={{ width: '100%', height: 400, border: 0 }}
                  />
                )}
              </Card>
            )}
          </Space>
        )}
      </DesignDrawer>
    </div>
  );
}
