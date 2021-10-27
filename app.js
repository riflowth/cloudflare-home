require('dotenv').config();
const axios = require('axios');

const API_ENDPOINT = 'https://api.cloudflare.com/client/v4'

const getZone = async (name) => {
  const zones = await requestApi('GET', 'zones');
  return zones.result.filter((zone) => zone.name === name)[0];
};

const getDnsRecords = async (zoneId) => {
  const records = await requestApi('GET', `zones/${zoneId}/dns_records`);
  return records.result;
};

const updateDnsRecord = async (zoneId, recordId, data) => {
  return requestApi('PUT', `zones/${zoneId}/dns_records/${recordId}`, data);
};

const getPublicIp = async () => {
  const res = await axios.get('https://bot.whatismyipaddress.com');
  return res.data;
};

const requestApi = async (method, endpoint, data) => {
  const res = await axios({
    method: method,
    url: `${API_ENDPOINT}/${endpoint}`,
    headers: {
      'Authorization': `Bearer ${process.env.TOKEN}`
    },
    data: data
  });
  return res.data;
};

const updateDomainIp = async (domain, ip) => {
  const zone = await getZone(domain);
  const records = await getDnsRecords(zone.id);

  const targetRecord = records.filter((record) => 
    (record.name === domain)
    && (record.type === 'A')
  )[0];

  const data = await updateDnsRecord(zone.id, targetRecord.id, {
    type: 'A',
    content: ip,
  });
  
  return data.success;
};

const update = async (domain) => {
  const ip = await getPublicIp();
  const isSuccess = updateDomainIp(domain, ip);

  console.log(isSuccess ? `Update ${domain} to ${ip}` : `Can not update ${domain} to ${ip}`);
};

update(process.env.DOMAIN);
setInterval(() => update(process.env.DOMAIN), 1000 * 60 * 15);