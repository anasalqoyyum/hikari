'use client';

import { Avatar, Badge, Button, Divider, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Navbar, Popover, PopoverContent, PopoverTrigger, Tooltip } from '@nextui-org/react';
import { Bars3Icon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ThemeSwitcherSwitch } from '@/components/theme-switcher';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { login, logout } from '@/actions/auth';
import { usePathname, useRouter } from 'next/navigation';
import { MAIN_ROUTES, ROUTES, Subroute, UserOnly, filterRoute } from '@/routes';
import { useUser } from '@/helpers/use-user';
import { useBreakpoint } from '@/helpers/use-breakpoint';
import { useCookies } from 'next-client-cookies';
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { FriendRequest, acceptFriendRequest, getFriendRequests, rejectFriendRequest } from '@/actions/friend';
import { useWindowListener } from '@/helpers/use-window-listener';
import { useErrorModal } from '@/components/error-modal';

export type HeaderSidebarProps = {
	children?: React.ReactNode,
};

const NOTIFICATION_DATETIME = {
	month: 'numeric',
	day: 'numeric',
	year: '2-digit',
	hour: 'numeric',
	minute: '2-digit'
} as const;

export const HeaderSidebar = ({ children }: HeaderSidebarProps) => {
	const user = useUser();
	const pathname = usePathname();
	const [isMenuOpen, _setMenuOpen] = useState(false);
	const breakpoint = useBreakpoint();
	const cookies = useCookies();
	const router = useRouter();
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
	const [isNotificationsOpen, _setNotificationsOpen] = useState(false);
	const [userDropdownOpen, setUserDropdownOpen] = useState(false);

	const path = pathname === '/' ? (user?.homepage ?? '/dashboard') : pathname;

	const from = cookies.get('actaeon-navigated-from');
	const filter = filterRoute.bind(null, user);
	const routeGroup = ROUTES.find(route => route.title === from || path?.startsWith(route.url))!;
	const { setTheme, theme } = useTheme();
	
	const setError = useErrorModal();

	useEffect(() => {
		if (user)
			getFriendRequests().then(setFriendRequests);
	}, [pathname, user]);

	const setNotificationsOpen = (open: boolean) => {
		_setNotificationsOpen(open);
		if (open)
			router.push('#notifications', { scroll: false });
	};

	const setMenuOpen = (open: boolean) => { 
		_setMenuOpen(open);
		if (open)
			router.push('#sidebar', { scroll: false });
	};

	useWindowListener('hashchange', () => {
		setMenuOpen(window.location.hash === '#sidebar');
		setNotificationsOpen(window.location.hash === '#notifications');
	});

	useEffect(() => {
		setMenuOpen(window.location.hash === '#sidebar');
		setNotificationsOpen(window.location.hash === '#notifications');
	}, []);

	const renderHeaderLink = (route: Subroute) => {
		const linkStyle = path?.startsWith(route.url) ?
			'font-semibold text-primary' : 'hover:text-secondary';

		if (route.routes?.length)
			return (<Dropdown key={route.url}>
				<DropdownTrigger>
					<Button className="bg-transparent p-0 m-0 min-h-0 min-w-0 h-auto overflow-visible" disableRipple>
						<div className={`flex items-center cursor-pointer mr-4 transition text-lg ${linkStyle}`} >
							{route.name}
							<ChevronDownIcon className="h-5 ml-1 mt-1" />
						</div>
					</Button>
				</DropdownTrigger>
				<DropdownMenu>
					{route.routes.filter(filter)
						.map(route => (<DropdownItem key={route.url} className="[&:hover_*]:text-secondary p-0"
							onPress={() => {
								router.push(route.url);
								cookies.set('actaeon-navigated-from', routeGroup.title);
							}}>
							<Link href={route.url}
								className={`w-full h-10 pl-2 items-center flex transition text-medium ${path?.startsWith(route.url) ? 'font-semibold text-primary' : ''}`}>{route.name}</Link>
						</DropdownItem>))}
				</DropdownMenu>
			</Dropdown>);

		return (<Link
			onClick={() => {
				cookies.set('actaeon-navigated-from', routeGroup.title);
			}}
			href={`${route.url}`} key={route.url}
			className={`mr-4 transition ${linkStyle}`}>
			{route.name}
		</Link>);
	};

	const notifications = useMemo(() => {
		if (!friendRequests.length) return null;

		return friendRequests.map(req => {
			const removeRequest = () => {
				setFriendRequests(r => r.filter(r => r.reqUuid !== req.reqUuid));
			}

			return (<section key={req.reqUuid} className="flex flex-col h-32 w-full bg-content1 px-4 py-2.5 rounded-lg border-gray-500/25 border mb-2 mr-1">
				<time dateTime={req.createdDate.toISOString()} className="text-xs ">
					{req.createdDate.toLocaleDateString(undefined, NOTIFICATION_DATETIME)}
				</time>
				<div>
					New friend request from <Link href={`/user/${req.userUuid}`} className="font-semibold underline transition hover:text-secondary" onClick={() => {
						setNotificationsOpen(false);
					}}>{req.username}</Link>
				</div>
				<div className="grid grid-cols-2 gap-2 mt-auto">
					<Button onPress={() => {
						rejectFriendRequest(req.reqUuid)
							.then(removeRequest)
							.catch(e => setError('Failed to reject friend request'));
					}}>Ignore</Button>
					<Button color="primary" onPress={() => {
						acceptFriendRequest(req.reqUuid)
							.then(removeRequest)
							.catch(() => setError('Failed to accept friend request'));
					}}>Accept</Button>
				</div>
			</section>);
		});
	}, [friendRequests]);

	return (<>
		{/* begin sidebar */}
		<div className={`fixed inset-0 w-full h-full z-[49] ${isMenuOpen ? '' : 'pointer-events-none'}`}>
			<div className={`transition bg-black z-[49] absolute inset-0 w-full h-full ${isMenuOpen ? 'bg-opacity-25' : 'bg-opacity-0 pointer-events-none'}`} onClick={() => {
				setMenuOpen(false);
				router.back();
			}} />

			<div className={`dark flex flex-col text-white absolute p-6 top-0 h-full max-w-full w-96 bg-gray-950 z-[49] transition-all ${isMenuOpen ? 'left-0 shadow-2xl' : '-left-full'}`}>
				<div className="flex">
					<Button className="text-2xl mb-6 font-bold cursor-pointer flex items-center ps-1.5 pe-2" variant="light"
						onClick={() => {
							setMenuOpen(false);
							router.back();
						}}>
						<ChevronLeftIcon className="h-6 mt-0.5" />
						<span>{ routeGroup.title }</span>
					</Button>
					<Button className="ml-auto" isIconOnly color="danger" onClick={() => {
						setMenuOpen(false);
						router.back();
					}}>
						<XMarkIcon className="w-5" />
					</Button>
				</div>
				<div className="overflow-y-auto">
					{ROUTES.map((route, i) => <Fragment key={i}>
						<div>
							{!filter(route) ? <div className={`select-none text-2xl ${route === routeGroup ? 'font-bold' : 'font-semibold'}`}>
								{route.name}
							</div> : <Link href={route.url} onClick={() => {
								setMenuOpen(false);
								cookies.remove('actaeon-navigated-from');
							}}
								className={`text-2xl transition hover:text-secondary ${route === routeGroup ? 'font-bold' : 'font-semibold'}`}>
								{route.name}
							</Link>}
							<div className="ml-2 mt-2">
								{route.routes?.filter(filter)?.map(subroute => <div className="mb-1" key={subroute.url}>
									{subroute.routes?.length ? <div
										className={`text-xl`}>
										{subroute.name}
										<div className="flex flex-col ml-1.5 pl-3 border-l border-gray-500/25 mt-0.5">
											{subroute.routes.filter(filter).map(route => (<Link href={route.url} key={route.url}
												className={`text-[1.075rem] transition ${path?.startsWith(route.url) ? 'font-semibold text-primary' : 'hover:text-secondary'}`}>
												{route.name}
											</Link>))}
										</div>
									</div> : <Link href={subroute.url} onClick={() => {
										setMenuOpen(false);
										cookies.remove('actaeon-navigated-from');
									}}
										className={`text-xl transition ${path?.startsWith(subroute.url) ? 'font-semibold text-primary' : 'hover:text-secondary'}`}>
										{subroute.name}
									</Link>}
								</div>)}
							</div>
						</div>
						{i < ROUTES.length - 1 && <Divider className="my-5" />}
					</Fragment>)}
				</div>
				<div className="mt-auto mb-4 flex items-baseline">
					<ThemeSwitcherSwitch />

					{user && <Link href="/settings" className="ml-auto">
              <Button isIconOnly variant="bordered" size="lg">
                  <AdjustmentsHorizontalIcon className="w-8" />
              </Button>
          </Link>}
				</div>
				<Button color="primary" className="w-full" onClick={() => user ? logout({ redirectTo: '/' }) : login()}>
					{user ? 'Logout' : 'Login'}
				</Button>
			</div>
		</div>
		{/* end sidebar */}

		{/* being mobile notifications */}
		<div className={`fixed inset-0 w-full h-full max-h-full z-[49] ${isNotificationsOpen ? '' : 'pointer-events-none'}`}>
			<div className={`flex flex-col dark text-white absolute pt-6 pb-3 top-0 h-full max-w-full w-full max-h-full bg-gray-950 z-[49] transition-all ${isNotificationsOpen ? 'left-0 shadow-2xl' : 'left-full'}`}>
				<header className="font-semibold text-2xl flex items-center pr-4 pl-2 w-full">
					<Link href={`/user/${user?.uuid}`} className="flex items-center gap-3" onClick={() => setNotificationsOpen(false)}>
						<Avatar name={user?.username?.[0]?.toUpperCase() ?? undefined} className={`w-12 h-12 ml-2.5 cursor-pointer text-2xl [font-feature-settings:"fwid"]`} />

						{user?.username}
					</Link>

					<Link href={`/user/${user?.uuid}`} className="ml-auto flex" onClick={() => setNotificationsOpen(false)}>
						<Button className="min-w-0">
							Profile
						</Button>
					</Link>
					<Button isIconOnly className="ml-2" color="danger" onPress={() => {
						setNotificationsOpen(false);
						router.back();
					}}>
						<XMarkIcon className="h-1/2" />
					</Button>
				</header>

				<Divider className="my-4" />

				<section className="px-2 flex flex-col flex-auto overflow-y-auto mb-3">
					<header className="font-semibold text-2xl px-2 mb-3">Notifications</header>
					{!friendRequests.length && <span className="ml-3 italic text-gray-500">No notifications</span>}
					<div className="overflow-y-auto flex-auto overflow-x-hidden">
						{notifications}
					</div>
				</section>

				<Button className="mt-auto mx-3 flex-shrink-0" color="danger" onPress={() => logout({ redirectTo: '/' })}>
					Logout
				</Button>
			</div>
		</div>
		{/* end mobile notifications */}

		{/* begin top navbar */}
		<div className="flex flex-col flex-grow">
			<Navbar className="w-full fixed" classNames={{ wrapper: 'max-w-full p-0' }} shouldHideOnScroll={breakpoint === undefined} height="5.5rem">
				<div className="flex h-header px-6 items-center flex-shrink-0 w-full z-[48]">
					<Button className="text-2xl font-bold cursor-pointer flex items-center m-0 ps-1.5 pe-2 mr-6" variant="light"
						onClick={() => setMenuOpen(true)}>
						<Bars3Icon className="h-6 mt-0.5" />
						<span>{ routeGroup.title }</span>
					</Button>
					<div className="mr-auto mt-1 hidden md:flex text-lg">
						{routeGroup.routes?.filter(filter).map(renderHeaderLink)}
					</div>
					<div className="mx-auto"></div>
					{routeGroup !== MAIN_ROUTES && <div className="mr-4 mt-1 hidden [@media(min-width:1175px)]:flex text-lg">
						{MAIN_ROUTES.routes.filter(filter).map(renderHeaderLink)}
					</div>}
					{user ? <>
						{friendRequests.length ? <Popover>
							<PopoverTrigger>
								<div className="hidden sm:block">
									<Badge content={friendRequests.length.toString()} color="danger" shape="circle">
										<div className="flex items-center justify-center border-medium w-unit-8 h-unit-8 border-default box-border rounded-small cursor-pointer">
											<BellAlertIcon className="h-5" />
										</div>
									</Badge>
								</div>
							</PopoverTrigger>
							<PopoverContent className="max-h-96 overflow-y-auto w-96 flex flex-col overflow-x-hidden pt-2.5 items-center justify-center">
								{ notifications }
							</PopoverContent>
						</Popover> : <Tooltip content={<span className="text-gray-500 italic">No notifications</span>}>
								<Button isIconOnly size="sm" variant="bordered" className="hidden sm:flex" disableRipple disableAnimation>
									<BellIcon className="h-5" />
								</Button>
						</Tooltip>}



						<Dropdown isOpen={userDropdownOpen && !isNotificationsOpen} onOpenChange={o => {
							if (!o || breakpoint)
								setUserDropdownOpen(o);
							else
								setNotificationsOpen(true);
						}}>
							<DropdownTrigger>
								<div className="flex items-center">
									<Badge content={friendRequests.length.toString()} color="danger" shape="circle" isInvisible={!!breakpoint || !friendRequests.length} size="lg">
										<Avatar name={user.username?.[0]?.toUpperCase() ?? undefined} className={`w-12 h-12 ml-2.5 cursor-pointer text-2xl [font-feature-settings:"fwid"]`} />
									</Badge>
								</div>
							</DropdownTrigger>
							<DropdownMenu>
								<DropdownItem showDivider className="p-0">
									<Link className="text-lg font-semibold block w-full h-full px-2 py-1.5" href={`/user/${user.uuid}`}>{user.username}</Link>
								</DropdownItem>
								<DropdownItem className="p-0 mt-1">
									<Link href="/settings" className="w-full h-full block px-2 py-1.5">
										Settings
									</Link>
								</DropdownItem>
								<DropdownItem className="p-0 mt-1" showDivider closeOnSelect={false}>
									<div className="w-full flex pl-2 h-8 items-center" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
										Dark Theme

										<ThemeSwitcherSwitch className="ml-auto" size="sm" />
									</div>
								</DropdownItem>
								<DropdownItem className="p-0" color="danger" variant="flat">
									<div className="w-full h-full block px-2 py-1.5 text-danger" onClick={() => logout({ redirectTo: '/' })}>
										Logout
									</div>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</> :
						
					<Button size="sm" className="ml-2" color="primary" onClick={() => login()}>
						Login
					</Button>
					}
				</div>
			</Navbar>

			<div className={`sm:px-5 flex-grow pt-fixed flex flex-col ${isNotificationsOpen ? 'overflow-hidden' : ''}`}>
				{children}
			</div>
		</div>
		{/*	end top navbar */}
	</>)
};
