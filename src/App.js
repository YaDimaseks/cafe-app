import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import View from '@vkontakte/vkui/dist/components/View/View';
import ScreenSpinner from '@vkontakte/vkui/dist/components/ScreenSpinner/ScreenSpinner';
//import SnackBar from '@vkontakte/vkui/dist/components/SnackBar/SnackBar';
import Avatar from '@vkontakte/vkui/dist/components/Avatar/Avatar';
import {Icon24Error} from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';

import Home from './panels/Home';
import Intro from './panels/Intro';
import {Snackbar} from "@vkontakte/vkui";
import * as PropTypes from "prop-types";

const ROUTES = {
    HOME: 'home',
    INTRO: 'intro',
};

const STORAGE_KEYS = {
    STATUS: 'status',
}

Snackbar.propTypes = {
    before: PropTypes.element,
    layout: PropTypes.string,
    onClose: PropTypes.func,
    duration: PropTypes.number,
    children: PropTypes.node
};
const App = () => {
	const [activePanel, setActivePanel] = useState(ROUTES.INTRO);
	const [fetchedUser, setUser] = useState(null);
	const [popout, setPopout] = useState(<ScreenSpinner size='large' />)
	const [userHasSeenIntro, setUserHasSeenIntro] = useState(false);
    const [snackbar, setSnackbar] = useState(null);

	useEffect(() => {
		bridge.subscribe(({ detail: { type, data }}) => {
			if (type === 'VKWebAppUpdateConfig') {
				const schemeAttribute = document.createAttribute('scheme');
				schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
				document.body.attributes.setNamedItem(schemeAttribute);
			}
		});
		async function fetchData() {
			const user = await bridge.send('VKWebAppGetUserInfo');


			await bridge.send('VKWebAppStorageSet', {
                key: STORAGE_KEYS.STATUS,
                value: JSON.stringify({
                    hasSeenIntro: false,
                }),
            });
            console.log(activePanel)

            const storageData = await bridge.send('VKWebAppStorageGet', {
                keys: Object.values(STORAGE_KEYS)
            });
            console.log(storageData)
            const data = {};
            storageData.keys.forEach(({key, value}) => {
                try{
                    data[key] = value ? JSON.parse(value) : {};
                    switch (key) {
                        case STORAGE_KEYS.STATUS:
                            if (data[key] && data[key].hasSeenIntro) {
                                setActivePanel(ROUTES.HOME);
                                setUserHasSeenIntro(true);
                            }
                            break;
                        default:
                            break;
                    }
                } catch (error){
                    setSnackbar(<Snackbar
                        layout='vertical'
                        onClose={() => setSnackbar(null)}
                        before={
                            <Avatar size={24} style={{backgroundColor: 'var(--dynamic-red)'}}
                            ><Icon24Error fill='#fff' width='14' height='14'/></Avatar>
                        }
                        duration={988}
                    >
                        Проблема с получением данных из Storage
                    </Snackbar>
                    );
                }
            });

            setUser(user);
			setPopout(null);
		}
		fetchData();
	}, []);

    const go = panel => {
        setActivePanel(panel);
    };

    const viewIntro = async (panel) => {
        try {
            await bridge.send('VKWebAppStorageSet', {
                key: STORAGE_KEYS.STATUS,
                value: JSON.stringify({
                    hasSeenIntro: true,
                }),
            });
            go(panel);
        } catch (error) {
            setSnackbar(<Snackbar
                    layout='vertical'
                    onClose={() => setSnackbar(null)}
                    before={<Avatar size={24} style={{backgroundColor: 'var(--dynamic_red)'}}><Icon24Error fill='#fff' width={14} height={14} /></Avatar>}
                    duration={900}
                >
                    Проблема с отправкой данных в Storage
                </Snackbar>
            );
        }
    }

	return (
	    <View activePanel={activePanel} popout={popout}>
            <Home id={ROUTES.HOME} fetchedUser={fetchedUser} go={go} snackbarError={snackbar}/>
            <Intro id={ROUTES.INTRO} fetchedUser={fetchedUser} go={viewIntro(ROUTES.HOME)} snackbarError={snackbar} userHasSeenIntro={userHasSeenIntro}/>
	    </View>
	);
}

export default App;

