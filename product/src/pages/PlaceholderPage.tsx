import { Button, Result, Tag } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import { SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";

export function PlaceholderPage({ title, scope = "P1" }: { title: string; scope?: string }) {
  const { navigateWithContext } = useAnalysisContext();
  return (
    <div className="standard-page placeholder-page">
      <SectionCard>
        <Result
          icon={<BgColorsOutlined />}
          title={`${title} · 设计中`}
          subTitle="信息架构与 API 依赖已经冻结；当前阶段不显示假业务数字，也不扩大为管理平台。"
          extra={<><Tag color="blue">{scope}</Tag><Button type="primary" onClick={() => navigateWithContext("/overview")}>返回总览</Button></>}
        />
      </SectionCard>
    </div>
  );
}
