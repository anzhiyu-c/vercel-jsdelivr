/*
 * @Description:
 * @Author: 安知鱼
 * @Email: anzhiyu-c@qq.com
 * @Date: 2023-08-26 09:52:01
 * @LastEditTime: 2023-09-01 14:20:51
 * @LastEditors: 安知鱼
 */
// api/proxy.js
const allowedPackages = require("../allowed-packages.json");

module.exports = async (req, res) => {
  const { scope, packageName, version, path, needEnd } = req.query;

  // 组合范围和包名
  const fullPackageName = scope ? `${scope}/${packageName}` : packageName;

  const packageConfig = allowedPackages.find(pkg => pkg.name === fullPackageName);
  console.log(fullPackageName, version, path, needEnd);

  if (!packageConfig) {
    res.status(403).send({ allowed: false, message: "Package not allowed" });
    return;
  }

  const pathMatch = packageConfig.allowedPaths.some(allowedPath => {
    if (allowedPath === "*") {
      return true;
    }
    console.log(allowedPath, path.startsWith(allowedPath));
    return path.startsWith(allowedPath);
  });

  if (!pathMatch) {
    res.status(403).send({ allowed: false, message: "Path not allowed" });
    return;
  }

  const versionSegment = version ? `@${version}` : "";
  const pathSegment = path ? `/${path}` : "/";
  const needEndSegment = pathSegment.endsWith("/") ? "" : needEnd ? "/" : "";

  const url = `https://cdn.jsdelivr.net/npm/${fullPackageName}${versionSegment}${pathSegment}${needEndSegment}`;
  console.log("url:", url);
  const fetchModule = await import("node-fetch");
  const fetch = fetchModule.default;
  const response = await fetch(url);

  if (!response.ok) {
    res.status(response.status).send(await response.text());
    return;
  }

  res.setHeader("Content-Type", response.headers.get("Content-Type"));
  res.status(response.status).send(await response.buffer());
};
