import type { Component } from "svelte";
import SkillsPanel from "../ui/islands/features/SkillsPanel.svelte";
import ProfilePanel from "../ui/islands/features/ProfilePanel.svelte";
import SearchPanel from "../ui/islands/features/SearchPanel.svelte";
import SettingsPanel from "../ui/islands/features/SettingsPanel.svelte";
import AuthPanel from "../ui/islands/features/AuthPanel.svelte";
import LogsPanel from "../ui/islands/features/LogsPanel.svelte";
import CookiesPanel from "../ui/islands/features/CookiesPanel.svelte";
import CampusPanel from "../ui/islands/features/CampusPanel.svelte";
import SalesPanel from "../ui/islands/features/SalesPanel.svelte";
import EventsPanel from "../ui/islands/features/EventsPanel.svelte";
import ProjectSearchPanel from "../ui/islands/features/ProjectSearchPanel.svelte";

export type IslandDef = {
	id: string;
	title: string;
	component: Component;
};

export type CategoryDef = {
	id: string;
	title: string;
	icon: string;
	islands: IslandDef[];
};

export const categories: CategoryDef[] = [
	{
		id: "dashboard",
		title: "Дашборд",
		icon: "grid",
		islands: [
			{ id: "campus", title: "Карта кампуса", component: CampusPanel },
			{ id: "sales", title: "Sales", component: SalesPanel },
			{ id: "events", title: "События", component: EventsPanel },
		],
	},
	{
		id: "profile",
		title: "Профиль",
		icon: "user",
		islands: [
			{ id: "profile", title: "Мой профиль", component: ProfilePanel },
			{ id: "skills", title: "Навыки", component: SkillsPanel },
		],
	},
	{
		id: "search",
		title: "Поиск",
		icon: "search",
		islands: [{ id: "search", title: "Поиск участника", component: SearchPanel }],
	},
	{
		id: "projects",
		title: "Проекты",
		icon: "folder",
		islands: [
			{ id: "project-search", title: "Поиск по проекту", component: ProjectSearchPanel },
		],
	},
	{
		id: "logs",
		title: "Логи",
		icon: "terminal",
		islands: [{ id: "logs", title: "Логи", component: LogsPanel }],
	},
	{
		id: "settings",
		title: "Настройки",
		icon: "sliders",
		islands: [{ id: "settings", title: "Настройки", component: SettingsPanel }],
	},
	{
		id: "auth",
		title: "Авторизация",
		icon: "key",
		islands: [
			{ id: "auth", title: "Авторизация", component: AuthPanel },
			{ id: "cookies", title: "Куки", component: CookiesPanel },
		],
	},
];
