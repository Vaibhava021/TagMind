import axios from 'axios'
import { installAxiosAuthentication } from './session'

installAxiosAuthentication(axios)

export default axios
